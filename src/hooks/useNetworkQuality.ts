import { create } from 'zustand'
import { ConnectionQuality, RoomEvent, type Room } from 'livekit-client'

// Types pour la qualité réseau
export type NetworkQualityLevel = 'excellent' | 'good' | 'medium' | 'poor' | 'unknown'

export interface AudioProfile {
  bitrate: number
  sampleRate: number
}

// Profils audio selon la qualité réseau
export const AUDIO_PROFILES: Record<NetworkQualityLevel, AudioProfile> = {
  excellent: { bitrate: 128, sampleRate: 48000 },
  good: { bitrate: 64, sampleRate: 44100 },
  medium: { bitrate: 32, sampleRate: 32000 },
  poor: { bitrate: 16, sampleRate: 16000 },
  unknown: { bitrate: 64, sampleRate: 44100 }, // Défaut
}

// Mapping LiveKit ConnectionQuality -> niveau de qualité
export function mapLiveKitQualityToLevel(quality: ConnectionQuality): NetworkQualityLevel {
  switch (quality) {
    case ConnectionQuality.Excellent:
      return 'excellent'
    case ConnectionQuality.Good:
      return 'good'
    case ConnectionQuality.Poor:
      return 'poor'
    case ConnectionQuality.Lost:
      return 'poor'
    default:
      return 'unknown'
  }
}

// Informations affichables pour chaque niveau
export const QUALITY_INFO: Record<NetworkQualityLevel, {
  label: string
  color: string
  bars: number
  description: string
}> = {
  excellent: {
    label: 'Excellente',
    color: 'var(--color-success)',
    bars: 4,
    description: 'Audio haute qualité (128kbps)',
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
    description: 'Audio économique (32kbps)',
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
    description: 'Qualité en cours d\'évaluation',
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

  // Historique pour éviter les changements trop fréquents
  qualityHistory: number[]
  lastQualityChange: number

  // Actions
  updateQuality: (localConnectionQuality: ConnectionQuality, remoteConnectionQuality?: ConnectionQuality) => NetworkQualityLevel | null
  resetQuality: () => void
  getStableQuality: () => NetworkQualityLevel
}

// Délai minimum entre deux changements de qualité (en ms)
const MIN_QUALITY_CHANGE_INTERVAL = 5000

// Nombre d'échantillons pour la moyenne mobile
const QUALITY_HISTORY_SIZE = 5

// Convert LiveKit ConnectionQuality to numeric score
function qualityToScore(quality: ConnectionQuality): number {
  switch (quality) {
    case ConnectionQuality.Excellent: return 1
    case ConnectionQuality.Good: return 2
    case ConnectionQuality.Poor: return 4
    case ConnectionQuality.Lost: return 5
    default: return 0
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

  updateQuality: (localConnectionQuality: ConnectionQuality, remoteConnectionQuality?: ConnectionQuality) => {
    const state = get()
    const now = Date.now()

    const uplinkScore = qualityToScore(localConnectionQuality)
    const downlinkScore = remoteConnectionQuality ? qualityToScore(remoteConnectionQuality) : 0

    // Ajouter à l'historique
    const newHistory = [...state.qualityHistory, uplinkScore].slice(-QUALITY_HISTORY_SIZE)

    // Calculer la moyenne mobile
    const averageScore = newHistory.reduce((a, b) => a + b, 0) / newHistory.length
    const stableQualityLevel = mapLiveKitQualityToLevel(
      averageScore <= 1.5 ? ConnectionQuality.Excellent :
      averageScore <= 2.5 ? ConnectionQuality.Good :
      ConnectionQuality.Poor
    )

    // Vérifier si on peut changer de qualité
    const canChange = now - state.lastQualityChange > MIN_QUALITY_CHANGE_INTERVAL
    const qualityChanged = stableQualityLevel !== state.localQuality && canChange

    set({
      localQualityScore: uplinkScore,
      remoteQualityScore: downlinkScore,
      remoteQuality: remoteConnectionQuality ? mapLiveKitQualityToLevel(remoteConnectionQuality) : state.remoteQuality,
      qualityHistory: newHistory,
      ...(qualityChanged ? {
        localQuality: stableQualityLevel,
        currentAudioProfile: AUDIO_PROFILES[stableQualityLevel],
        lastQualityChange: now,
      } : {}),
    })

    // Retourner le nouveau niveau si changé (pour déclencher un toast)
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
      average <= 1.5 ? ConnectionQuality.Excellent :
      average <= 2.5 ? ConnectionQuality.Good :
      ConnectionQuality.Poor
    )
  },
}))

/**
 * Configure les listeners de qualité réseau sur une Room LiveKit
 * Retourne une fonction de nettoyage
 */
export function setupNetworkQualityListener(
  room: Room,
  onQualityChange?: (newQuality: NetworkQualityLevel, oldQuality: NetworkQualityLevel) => void
): () => void {
  const handleConnectionQualityChanged = (quality: ConnectionQuality, participant: { identity: string; sid: string }) => {
    // Only track local participant quality
    if (participant.sid === room.localParticipant?.sid) {
      const previousQuality = useNetworkQualityStore.getState().localQuality
      const newQuality = useNetworkQualityStore.getState().updateQuality(quality)

      // Notifier si la qualité a changé
      if (newQuality && onQualityChange) {
        onQualityChange(newQuality, previousQuality)
      }
    }
  }

  room.on(RoomEvent.ConnectionQualityChanged, handleConnectionQualityChanged)

  // Retourner la fonction de nettoyage
  return () => {
    room.off(RoomEvent.ConnectionQualityChanged, handleConnectionQualityChanged)
    useNetworkQualityStore.getState().resetQuality()
  }
}

/**
 * Ajuste les paramètres audio selon la qualité
 */
export async function adjustAudioQuality(
  _room: Room,
  quality: NetworkQualityLevel
): Promise<void> {
  const profile = AUDIO_PROFILES[quality]

  try {
    console.log(`[NetworkQuality] Ajustement audio vers ${quality}:`, profile)
  } catch (error) {
    console.error('[NetworkQuality] Erreur lors de l\'ajustement audio:', error)
  }
}

// Hook utilitaire pour accéder facilement aux infos de qualité
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
