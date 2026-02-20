// useAppStoreReview - Demande d'avis App Store / Google Play
// Respecte les guidelines Apple (max 3 demandes par an)
// Déclenché uniquement après des événements positifs

const STORAGE_KEY = 'squadplanner_review_requests'
const MAX_REQUESTS_PER_YEAR = 3

export type ReviewTrigger = 'session_completed' | 'level_up' | 'badge_earned'

interface ReviewRecord {
  timestamps: number[] // epoch ms
}

// ── Platform detection ──────────────────────────────────────────

function isNative(): boolean {
  return !!(globalThis as any).Capacitor?.isNativePlatform?.()
}

function getPlatform(): 'ios' | 'android' | null {
  if (!isNative()) return null
  const cap = (globalThis as any).Capacitor
  const platform = cap?.getPlatform?.()
  if (platform === 'ios') return 'ios'
  if (platform === 'android') return 'android'
  return null
}

// ── Storage helpers ─────────────────────────────────────────────

function getReviewRecord(): ReviewRecord {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as ReviewRecord
    }
  } catch {
    // Corrupted data, reset
  }
  return { timestamps: [] }
}

function saveReviewRecord(record: ReviewRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    // localStorage unavailable (SSR, private mode)
  }
}

// ── Rate limiting ───────────────────────────────────────────────

export function canRequestReview(): boolean {
  if (!isNative()) return false

  const record = getReviewRecord()
  const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000

  // Compter les demandes de l'année écoulée
  const recentRequests = record.timestamps.filter((ts) => ts > oneYearAgo)
  return recentRequests.length < MAX_REQUESTS_PER_YEAR
}

export function getRequestCountThisYear(): number {
  const record = getReviewRecord()
  const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000
  return record.timestamps.filter((ts) => ts > oneYearAgo).length
}

// ── Native review request ───────────────────────────────────────

async function requestNativeReview(): Promise<boolean> {
  const platform = getPlatform()
  if (!platform) return false

  try {
    // Tenter d'utiliser le plugin @capawesome/capacitor-app-review
    // ou le plugin @capacitor-community/in-app-review
    // Fallback: utiliser l'API native directement via Capacitor
    const { AppReview } = await import(/* @vite-ignore */ '@capawesome/capacitor-app-review')
    await AppReview.requestReview()
    return true
  } catch {
    // Plugin non installé - fallback silencieux
    // L'App Store review ne peut pas être forcée, c'est un best-effort
    console.warn('[useAppStoreReview] AppReview plugin not available')
    return false
  }
}

// ── Main function ───────────────────────────────────────────────

/**
 * Demande un avis si les conditions sont remplies :
 * - On est sur une plateforme native (iOS/Android)
 * - Moins de 3 demandes dans l'année
 * - Le trigger est un événement positif
 */
export async function requestReviewIfAppropriate(
  trigger: ReviewTrigger
): Promise<boolean> {
  // Vérifier qu'on est sur native
  if (!isNative()) return false

  // Vérifier le rate limit
  if (!canRequestReview()) return false

  // Demander l'avis
  const requested = await requestNativeReview()

  if (requested) {
    // Enregistrer la demande
    const record = getReviewRecord()
    record.timestamps.push(Date.now())
    saveReviewRecord(record)
  }

  return requested
}

// ── Hook (pour usage dans les composants React) ─────────────────

export function useAppStoreReview() {
  return {
    requestReviewIfAppropriate,
    canRequestReview,
    getRequestCountThisYear,
    isNativeApp: isNative(),
  }
}

export default useAppStoreReview
