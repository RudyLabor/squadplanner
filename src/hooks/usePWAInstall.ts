/**
 * PHASE 5.2 — PWA Install Prompt
 *
 * Zustand store to capture the browser's `beforeinstallprompt` event
 * and show a smart install banner after meaningful engagement.
 *
 * Behavior:
 * - Captures `beforeinstallprompt` event
 * - Shows banner after 3 visits (localStorage `sq-visits`)
 * - If dismissed, waits 7 days before showing again
 * - Detects if already installed (display-mode: standalone)
 */
import { create } from 'zustand'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAInstallState {
  deferredPrompt: BeforeInstallPromptEvent | null
  isInstallable: boolean
  showBanner: boolean
  setDeferredPrompt: (e: BeforeInstallPromptEvent) => void
  promptInstall: () => Promise<boolean>
  dismissBanner: () => void
}

const VISIT_KEY = 'sq-visits'
const DISMISS_KEY = 'sq-pwa-dismissed'
const INSTALL_KEY = 'sq-pwa-installed'
const MIN_VISITS = 3
const DISMISS_DAYS = 7

function isAlreadyInstalled(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as { standalone?: boolean }).standalone === true
}

function shouldShowBanner(): boolean {
  if (typeof window === 'undefined') return false
  if (isAlreadyInstalled()) return false
  if (localStorage.getItem(INSTALL_KEY)) return false

  // Check dismiss cooldown
  const dismissedAt = localStorage.getItem(DISMISS_KEY)
  if (dismissedAt) {
    const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24)
    if (daysSince < DISMISS_DAYS) return false
  }

  // Check visit count
  const visits = Number(localStorage.getItem(VISIT_KEY) || '0') + 1
  localStorage.setItem(VISIT_KEY, String(visits))
  return visits >= MIN_VISITS
}

export const usePWAInstallStore = create<PWAInstallState>((set, get) => ({
  deferredPrompt: null,
  isInstallable: false,
  showBanner: false,

  setDeferredPrompt: (e) => {
    set({
      deferredPrompt: e,
      isInstallable: true,
      showBanner: shouldShowBanner(),
    })
  },

  promptInstall: async () => {
    const { deferredPrompt } = get()
    if (!deferredPrompt) return false

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted' && typeof window !== 'undefined') {
      localStorage.setItem(INSTALL_KEY, 'true')
    }

    set({ deferredPrompt: null, isInstallable: false, showBanner: false })
    return outcome === 'accepted'
  },

  dismissBanner: () => {
    if (typeof window !== 'undefined') localStorage.setItem(DISMISS_KEY, String(Date.now()))
    set({ showBanner: false })
  },
}))
