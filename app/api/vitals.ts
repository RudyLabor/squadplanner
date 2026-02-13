// API endpoint pour Core Web Vitals
import type { ActionFunction } from '@remix-run/node'

interface WebVitalPayload {
  name: 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
  userAgent: string
  sessionId: string
  deviceType: 'mobile' | 'desktop' | 'tablet'
  connection?: string
  buildVersion?: string
  branch?: string
}

// Simple in-memory storage (en prod : PostgreSQL/InfluxDB)
const vitalsStore: WebVitalPayload[] = []

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }
  
  try {
    const payload: WebVitalPayload = await request.json()
    
    // Validation basique
    if (!payload.name || !payload.value || !payload.sessionId) {
      return new Response('Invalid payload', { status: 400 })
    }
    
    // Store metric
    vitalsStore.push({
      ...payload,
      timestamp: Date.now() // Server timestamp pour cohérence
    })
    
    // Alert si performance critique
    if (payload.rating === 'poor') {
      console.warn(`🚨 POOR PERFORMANCE: ${payload.name} = ${payload.value} for ${payload.url}`)
      
      // En prod : envoyer à Slack/Discord
      // await sendSlackAlert(payload)
    }
    
    // Analytics aggregation (simple)
    const recentVitals = vitalsStore
      .filter(v => v.name === payload.name && Date.now() - v.timestamp < 60000) // Last 1min
      .map(v => v.value)
    
    const avgValue = recentVitals.reduce((a, b) => a + b, 0) / recentVitals.length
    const p95Value = recentVitals.sort((a, b) => a - b)[Math.floor(recentVitals.length * 0.95)]
    
    console.log(`📊 ${payload.name} - Avg: ${avgValue.toFixed(2)}, P95: ${p95Value?.toFixed(2)}`)
    
    return new Response(JSON.stringify({ 
      status: 'ok', 
      stored: true,
      stats: { avg: avgValue, p95: p95Value }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Vitals API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}