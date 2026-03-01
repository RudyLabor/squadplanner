import { create } from 'zustand'

// Types pour la qualite reseau
export type NetworkQualityLevel = 'excellent' | 'good' | 'medium' | 'poor' | 'unknown'

export interface AudioProfile {
  bitrate: number
  sampleRate: number
}

// Profils audio selon la qualite reseau
export const AUDIO_PROFILES: Record<NetworkQualityLevel, AudioProfile> = {
  excellent: { bitrate: 128, sampleRate: 48000 },
  good: { bitrate: 64, sampleRate: 44100 },
  medium: { bitrate: 32, sampleRate: 32000 },
  poor: { bitrate: 16, sampleRate: 16000 },
  unknown: { bitrate: 64, sampleRate: 44100 }, // Defaut
}

// Network quality values (previously mirrored from LiveKit, now standalone)
// Native WebRTC implementation
const CQ_EXCELLENT = 'excellent' as const
const CQ_GOOD = 'good' as const
const CQ_POOR = 'poor' as const
const CQ_LOST = 'lost' as const

// Opaque quality value received from LiveKit at runtime (string enum)
type ConnectionQualityValue =
  | typeof CQ_EXCELLENT
  | typeof CQ_GOOD
  | typeof CQ_POOR
  | typeof CQ_LOST
  | string

// Mapping LiveKit ConnectionQuality -> niveau de qualite
export function mapLiveKitQualityToLevel(quality: ConnectionQualityValue): NetworkQualityLevel {
  switch (quality) {
    case CQ_EXCELLENT:
      return 'excellent'
    case CQ_GOOD:
      return 'good'
    case CQ_POOR:
      return 'poor'
    case CQ_LOST:
      return 'poor'
    default:
      return 'unknown'
  }
}

// Informations affichables pour chaque niveau
export const QUALITY_INFO: Record<
  NetworkQualityLevel,
  {
    label: string
    color: string
    bars: number
    description: string
  }
> = {
  excellent: {
    label: 'Excellente',
    color: 'var(--color-success)',
    bars: 4,
    description: 'Audio haute qualite (128kbps)',
  },
  good: {
    label: 'Bonne',
    color: 'var(--color-success)',
    bars: 3,
    description: 'Audio standard (64kbps)',
  },
  medium: {
    label: 'Moyenne',
    color: 'var(--color-gold)',
    bars: 2,
    description: 'Audio economique (32kbps)',
  },
  poor: {
    label: 'Faible',
    color: 'var(--color-error)',
    bars: 1,
    description: 'Mode survie (16kbps)',
  },
  unknown: {
    label: 'Inconnue',
    color: 'var(--color-text-tertiary)',
    bars: 0,
    description: "Qualité en cours d'évaluation",
  },
}

// État du store
interface NetworkQualityState {
  // Qualité réseau locale (uplink)
  localQuality: NetworkQualityLevel
  localQualityScore: number // Score 0-4 (mapped from LiveKit)

  // Qualité réseau distante (downlink)
  remoteQuality: NetworkQualityLevel
  remoteQualityScore: number

  // Profil audio actuel
  currentAudioProfile: AudioProfile

  // Historique pour eviter les changements trop frequents
  qualityHistory: number[]
  lastQualityChange: number

  // Actions - accept plain string values (the LiveKit enum values)
  updateQuality: (
    localConnectionQuality: ConnectionQualityValue,
    remoteConnectionQuality?: ConnectionQualityValue
  ) => NetworkQualityLevel | null
  resetQuality: () => void
  getStableQuality: () => NetworkQualityLevel
}

// Delai minimum entre deux changements de qualite (en ms)
const MIN_QUALITY_CHANGE_INTERVAL = 5000

// Nombre d'echantillons pour la moyenne mobile
const QUALITY_HISTORY_SIZE = 5

// Convert LiveKit ConnectionQuality to numeric score
function qualityToScore(quality: ConnectionQualityValue): number {
  switch (quality) {
    case CQ_EXCELLENT:
      return 1
    case CQ_GOOD:
      return 2
    case CQ_POOR:
      return 4
    case CQ_LOST:
      return 5
    default:
      return 0
  }
}

export const useNetworkQualityStore = create<NetworkQualityState>((set, get) => ({
  localQuality: 'unknown',
  localQualityScore: 0,
  remoteQuality: 'unknown',
  remoteQualityScore: 0,
  currentAudioProfile: AUDIO_PROFILES.good,
  qualityHistory: [],
  lastQualityChange: 0,

  updateQuality: (
    localConnectionQuality: ConnectionQualityValue,
    remoteConnectionQuality?: ConnectionQualityValue
  ) => {
    const state = get()
    const now = Date.now()

    const uplinkScore = qualityToScore(localConnectionQuality)
    const downlinkScore = remoteConnectionQuality ? qualityToScore(remoteConnectionQuality) : 0

    // Ajouter a l'historique
    const newHistory = [...state.qualityHistory, uplinkScore].slice(-QUALITY_HISTORY_SIZE)

    // Calculer la moyenne mobile
    const averageScore = newHistory.reduce((a, b) => a + b, 0) / newHistory.length
    const stableQualityLevel = mapLiveKitQualityToLevel(
      averageScore <= 1.5 ? CQ_EXCELLENT : averageScore <= 2.5 ? CQ_GOOD : CQ_POOR
    )

    // Verifier si on peut changer de qualite
    const canChange = now - state.lastQualityChange > MIN_QUALITY_CHANGE_INTERVAL
    const qualityChanged = stableQualityLevel !== state.localQuality && canChange

    set({
      localQualityScore: uplinkScore,
      remoteQualityScore: downlinkScore,
      remoteQuality: remoteConnectionQuality
        ? mapLiveKitQualityToLevel(remoteConnectionQuality)
        : state.remoteQuality,
      qualityHistory: newHistory,
      ...(qualityChanged
        ? {
            localQuality: stableQualityLevel,
            currentAudioProfile: AUDIO_PROFILES[stableQualityLevel],
            lastQualityChange: now,
          }
        : {}),
    })

    // Retourner le nouveau niveau si change (pour declencher un toast)
    return qualityChanged ? stableQualityLevel : null
  },

  resetQuality: () => {
    set({
      localQuality: 'unknown',
      localQualityScore: 0,
      remoteQuality: 'unknown',
      remoteQualityScore: 0,
      currentAudioProfile: AUDIO_PROFILES.good,
      qualityHistory: [],
      lastQualityChange: 0,
    })
  },

  getStableQuality: () => {
    const state = get()
    if (state.qualityHistory.length === 0) return 'unknown'
    const average = state.qualityHistory.reduce((a, b) => a + b, 0) / state.qualityHistory.length
    return mapLiveKitQualityToLevel(
      average <= 1.5 ? CQ_EXCELLENT : average <= 2.5 ? CQ_GOOD : CQ_POOR
    )
  },
}))

/**
 * Configure les listeners de qualite reseau sur une Room LiveKit
 * Retourne une fonction de nettoyage
 *
 * NOTE: room is typed as `any` to avoid importing livekit-client at module
 * level. Callers always pass an actual Room instance obtained via dynamic
 * import so the runtime behaviour is identical.
 */

export function setupNetworkQualityListener(
  room: any,
  onQualityChange?: (newQuality: NetworkQualityLevel, oldQuality: NetworkQualityLevel) => void
): () => void {
  // RoomEvent.ConnectionQualityChanged === 'connectionQualityChanged'
  const CONNECTION_QUALITY_CHANGED = 'connectionQualityChanged'

  const handleConnectionQualityChanged = (
    quality: ConnectionQualityValue,
    participant: { identity: string; sid: string }
  ) => {
    // Only track local participant quality
    if (participant.sid === room.localParticipant?.sid) {
      const previousQuality = useNetworkQualityStore.getState().localQuality
      const newQuality = useNetworkQualityStore.getState().updateQuality(quality)

      // Notifier si la qualite a change
      if (newQuality && onQualityChange) {
        onQualityChange(newQuality, previousQuality)
      }
    }
  }

  room.on(CONNECTION_QUALITY_CHANGED, handleConnectionQualityChanged)

  // Retourner la fonction de nettoyage
  return () => {
    room.off(CONNECTION_QUALITY_CHANGED, handleConnectionQualityChanged)
    useNetworkQualityStore.getState().resetQuality()
  }
}

/**
 * Ajuste les paramètres audio selon la qualité
 */
export async function adjustAudioQuality(
  _room: unknown,
  quality: NetworkQualityLevel
): Promise<void> {
  const profile = AUDIO_PROFILES[quality]

  try {
    console.log(`[NetworkQuality] Ajustement audio vers ${quality}:`, profile)
  } catch (error) {
    console.warn("[NetworkQuality] Erreur lors de l'ajustement audio:", error)
  }
}

/**
 * Convenience hook for accessing network quality state and derived audio profile.
 * Quality level is computed from a moving-average history of connection measurements.
 * Returns current level, label, color, icon, and the recommended audio encoding profile.
 */
export function useNetworkQuality() {
  const store = useNetworkQualityStore()
  const qualityInfo = QUALITY_INFO[store.localQuality]

  return {
    ...store,
    qualityInfo,
    isGoodQuality: store.localQuality === 'excellent' || store.localQuality === 'good',
    isPoorQuality: store.localQuality === 'poor',
  }
}
