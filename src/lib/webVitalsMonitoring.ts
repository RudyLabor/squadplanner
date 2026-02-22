// Core Web Vitals Monitoring 2026
// Real-time performance tracking comme Linear/Discord

interface WebVital {
  name: 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
  userAgent: string
}

interface PerformanceMetrics {
  // Core Web Vitals
  cls?: WebVital
  fcp?: WebVital
  fid?: WebVital
  lcp?: WebVital
  ttfb?: WebVital
  inp?: WebVital

  // Custom metrics
  timeToInteractive?: number
  firstByteTime?: number
  domContentLoaded?: number
  bundleSize?: number

  // User context
  connection?: string
  deviceType?: 'mobile' | 'desktop' | 'tablet'
  sessionId: string
}

// Thresholds Google 2026
const VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
} as const

class WebVitalsCollector {
  private metrics: PerformanceMetrics
  private observers: PerformanceObserver[] = []
  private onMetric?: (metric: WebVital) => void

  constructor(sessionId: string) {
    this.metrics = { sessionId }
    this.initializeObservers()
  }

  private initializeObservers() {
    // Cumulative Layout Shift (CLS)
    this.observeEntry('layout-shift', (entries) => {
      let clsValue = 0
      for (const entry of entries) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }

      if (clsValue > 0) {
        this.reportVital('CLS', clsValue)
      }
    })

    // First Contentful Paint (FCP)
    this.observeEntry('paint', (entries) => {
      const fcp = entries.find((entry) => entry.name === 'first-contentful-paint')
      if (fcp) {
        this.reportVital('FCP', fcp.startTime)
      }
    })

    // Largest Contentful Paint (LCP)
    this.observeEntry('largest-contentful-paint', (entries) => {
      const lcp = entries[entries.length - 1] // Latest LCP
      if (lcp) {
        this.reportVital('LCP', lcp.startTime)
      }
    })

    // First Input Delay (FID) / Interaction to Next Paint (INP)
    this.observeEntry('first-input', (entries) => {
      const fid = entries[0]
      if (fid) {
        this.reportVital('FID', (fid as any).processingStart - fid.startTime)
      }
    })

    // Time to First Byte (TTFB)
    if ('navigation' in performance) {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.fetchStart
        this.reportVital('TTFB', ttfb)
      }
    }

    // Custom: Time to Interactive
    this.calculateTimeToInteractive()

    // Device/Connection context
    this.collectDeviceInfo()
  }

  private observeEntry(entryType: string, callback: (entries: PerformanceEntry[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries())
      })
      observer.observe({ type: entryType, buffered: true })
      this.observers.push(observer)
    } catch (error) {
      console.warn(`[WebVitals] Cannot observe ${entryType}:`, error)
    }
  }

  private reportVital(name: WebVital['name'], value: number) {
    const thresholds = VITALS_THRESHOLDS[name]
    const rating =
      value <= thresholds.good ? 'good' : value <= thresholds.poor ? 'needs-improvement' : 'poor'

    const vital: WebVital = {
      name,
      value: Math.round(value * 100) / 100, // Round to 2 decimals
      rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    ;(this.metrics as any)[name.toLowerCase()] = vital
    this.onMetric?.(vital)

    // Send to monitoring service immediately (for real-time alerts)
    this.sendToMonitoring(vital)
  }

  private calculateTimeToInteractive() {
    // Simplified TTI calculation
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming
        const tti = navigation.domInteractive - navigation.fetchStart
        this.metrics.timeToInteractive = tti
      }, 100)
    })
  }

  private collectDeviceInfo() {
    // Device type detection
    const userAgent = navigator.userAgent
    this.metrics.deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop'

    // Connection info
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      this.metrics.connection = connection?.effectiveType || 'unknown'
    }
  }

  private async sendToMonitoring(vital: WebVital) {
    try {
      // Send to analytics endpoint
      await fetch('/api/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vital,
          sessionId: this.metrics.sessionId,
          deviceType: this.metrics.deviceType,
          connection: this.metrics.connection,
          // Additional context
          buildVersion: import.meta.env.VITE_BUILD_VERSION,
          branch: import.meta.env.VITE_GIT_BRANCH,
        }),
      })

      // Also send to Sentry for real-time alerts
      if (vital.rating === 'poor') {
        console.warn(`[PERFORMANCE ALERT] ${vital.name}: ${vital.value} (${vital.rating})`)
      }
    } catch (error) {
      console.warn('[WebVitals] Failed to send metric:', error)
    }
  }

  // Get current performance score (0-100)
  getPerformanceScore(): number {
    const vitals = [this.metrics.cls, this.metrics.fcp, this.metrics.lcp, this.metrics.fid]
    const validVitals = vitals.filter(Boolean)

    if (validVitals.length === 0) return 0

    const goodCount = validVitals.filter((v) => v?.rating === 'good').length
    const needsImprovementCount = validVitals.filter(
      (v) => v?.rating === 'needs-improvement'
    ).length

    // Scoring: good = 100, needs-improvement = 60, poor = 20
    const score =
      (goodCount * 100 +
        needsImprovementCount * 60 +
        (validVitals.length - goodCount - needsImprovementCount) * 20) /
      validVitals.length

    return Math.round(score)
  }

  // Real-time performance dashboard data
  getDashboardData() {
    return {
      score: this.getPerformanceScore(),
      vitals: {
        cls: this.metrics.cls,
        fcp: this.metrics.fcp,
        lcp: this.metrics.lcp,
        fid: this.metrics.fid,
        ttfb: this.metrics.ttfb,
      },
      context: {
        deviceType: this.metrics.deviceType,
        connection: this.metrics.connection,
        timeToInteractive: this.metrics.timeToInteractive,
      },
    }
  }

  onVital(callback: (vital: WebVital) => void) {
    this.onMetric = callback
  }

  disconnect() {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers = []
  }
}

// Hook React pour monitoring
import { useEffect, useState } from 'react'

export function useWebVitalsMonitoring(sessionId: string) {
  const [collector] = useState(() => new WebVitalsCollector(sessionId))
  const [vitals, setVitals] = useState<WebVital[]>([])
  const [performanceScore, setPerformanceScore] = useState(0)

  useEffect(() => {
    collector.onVital((vital) => {
      setVitals((prev) => [...prev, vital])
      setPerformanceScore(collector.getPerformanceScore())
    })

    return () => collector.disconnect()
  }, [collector])

  return {
    vitals,
    performanceScore,
    dashboardData: collector.getDashboardData(),
  }
}

// Performance Budget Monitoring
export class PerformanceBudget {
  private budgets = {
    bundleSize: 200 * 1024, // 200KB max
    lcp: 2500, // 2.5s max
    fcp: 1800, // 1.8s max
    cls: 0.1, // 0.1 max
    tti: 3000, // 3s max
  }

  checkBudget(metrics: PerformanceMetrics): { passed: boolean; violations: string[] } {
    const violations: string[] = []

    if (metrics.lcp && metrics.lcp.value > this.budgets.lcp) {
      violations.push(`LCP exceeded budget: ${metrics.lcp.value}ms > ${this.budgets.lcp}ms`)
    }

    if (metrics.fcp && metrics.fcp.value > this.budgets.fcp) {
      violations.push(`FCP exceeded budget: ${metrics.fcp.value}ms > ${this.budgets.fcp}ms`)
    }

    if (metrics.cls && metrics.cls.value > this.budgets.cls) {
      violations.push(`CLS exceeded budget: ${metrics.cls.value} > ${this.budgets.cls}`)
    }

    if (metrics.timeToInteractive && metrics.timeToInteractive > this.budgets.tti) {
      violations.push(`TTI exceeded budget: ${metrics.timeToInteractive}ms > ${this.budgets.tti}ms`)
    }

    return {
      passed: violations.length === 0,
      violations,
    }
  }
}

// Dashboard data structure (component will be in separate .tsx file)

// Global monitoring initialization
export function initializeWebVitalsMonitoring() {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const collector = new WebVitalsCollector(sessionId)

  // Set up real-time alerts for poor vitals
  collector.onVital((vital) => {
    if (vital.rating === 'poor') {
      // Trigger alert to development team
      console.error(`🚨 PERFORMANCE ALERT: ${vital.name} = ${vital.value} (${vital.rating})`)

      // In production, send to Slack/Discord webhook
      if (import.meta.env.PROD) {
        fetch('/api/alerts/performance', {
          method: 'POST',
          body: JSON.stringify({ vital, sessionId }),
        }).catch(console.warn)
      }
    }
  })

  return collector
}
