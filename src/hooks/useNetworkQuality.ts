import { create } from 'zustand'
import type { IAgoraRTCClient } from 'agora-rtc-sdk-ng'

// Types pour la qualité réseau
export type NetworkQualityLevel = 'excellent' | 'good' | 'medium' | 'poor' | 'unknown'

export interface AudioProfile {
  bitrate: number
  sampleRate: number
}

// Profils audio Agora selon la qualité réseau
export const AUDIO_PROFILES: Record<NetworkQualityLevel, AudioProfile> = {
  excellent: { bitrate: 128, sampleRate: 48000 },
  good: { bitrate: 64, sampleRate: 44100 },
  medium: { bitrate: 32, sampleRate: 32000 },
  poor: { bitrate: 16, sampleRate: 16000 },
  unknown: { bitrate: 64, sampleRate: 44100 }, // Défaut
}

// Mapping score Agora -> niveau de qualité
// Score Agora: 0=inconnu, 1=excellent, 2=bon, 3=moyen, 4=mauvais, 5=très mauvais
export function mapAgoraQualityToLevel(agoraScore: number): NetworkQualityLevel {
  if (agoraScore === 0) return 'unknown'
  if (agoraScore <= 2) return 'excellent'
  if (agoraScore === 3) return 'good'
  if (agoraScore === 4) return 'medium'
  return 'poor'
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
  localQualityScore: number // Score brut Agora (0-5)

  // Qualité réseau distante (downlink)
  remoteQuality: NetworkQualityLevel
  remoteQualityScore: number

  // Profil audio actuel
  currentAudioProfile: AudioProfile

  // Historique pour éviter les changements trop fréquents
  qualityHistory: number[]
  lastQualityChange: number

  // Actions
  updateQuality: (uplinkScore: number, downlinkScore: number) => NetworkQualityLevel | null
  resetQuality: () => void
  getStableQuality: () => NetworkQualityLevel
}

// Délai minimum entre deux changements de qualité (en ms)
const MIN_QUALITY_CHANGE_INTERVAL = 5000

// Nombre d'échantillons pour la moyenne mobile
const QUALITY_HISTORY_SIZE = 5

export const useNetworkQualityStore = create<NetworkQualityState>((set, get) => ({
  localQuality: 'unknown',
  localQualityScore: 0,
  remoteQuality: 'unknown',
  remoteQualityScore: 0,
  currentAudioProfile: AUDIO_PROFILES.good,
  qualityHistory: [],
  lastQualityChange: 0,

  updateQuality: (uplinkScore: number, downlinkScore: number) => {
    const state = get()
    const now = Date.now()

    // Ajouter à l'historique
    const newHistory = [...state.qualityHistory, uplinkScore].slice(-QUALITY_HISTORY_SIZE)

    // Calculer la moyenne mobile
    const averageScore = newHistory.reduce((a, b) => a + b, 0) / newHistory.length
    const stableQualityLevel = mapAgoraQualityToLevel(Math.round(averageScore))

    // Vérifier si on peut changer de qualité
    const canChange = now - state.lastQualityChange > MIN_QUALITY_CHANGE_INTERVAL
    const qualityChanged = stableQualityLevel !== state.localQuality && canChange

    set({
      localQualityScore: uplinkScore,
      remoteQualityScore: downlinkScore,
      remoteQuality: mapAgoraQualityToLevel(downlinkScore),
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
    return mapAgoraQualityToLevel(Math.round(average))
  },
}))

/**
 * Configure les listeners de qualité réseau sur un client Agora
 * Retourne une fonction de nettoyage
 */
export function setupNetworkQualityListener(
  client: IAgoraRTCClient,
  onQualityChange?: (newQuality: NetworkQualityLevel, oldQuality: NetworkQualityLevel) => void
): () => void {
  const handleNetworkQuality = (stats: { uplinkNetworkQuality: number; downlinkNetworkQuality: number }) => {
    const previousQuality = useNetworkQualityStore.getState().localQuality
    const newQuality = useNetworkQualityStore.getState().updateQuality(
      stats.uplinkNetworkQuality,
      stats.downlinkNetworkQuality
    )

    // Notifier si la qualité a changé
    if (newQuality && onQualityChange) {
      onQualityChange(newQuality, previousQuality)
    }
  }

  client.on('network-quality', handleNetworkQuality)

  // Retourner la fonction de nettoyage
  return () => {
    client.off('network-quality', handleNetworkQuality)
    useNetworkQualityStore.getState().resetQuality()
  }
}

/**
 * Ajuste les paramètres audio du client Agora selon la qualité
 * À appeler quand la qualité change
 */
export async function adjustAudioQuality(
  _client: IAgoraRTCClient,
  quality: NetworkQualityLevel
): Promise<void> {
  const profile = AUDIO_PROFILES[quality]

  try {
    // Note: Agora RTC SDK NG n'a pas de méthode directe pour changer le bitrate
    // après la création de la piste. On peut utiliser setEncoderConfiguration
    // sur le localAudioTrack si disponible, sinon on log juste le changement.
    console.log(`[NetworkQuality] Ajustement audio vers ${quality}:`, profile)

    // Pour les clients qui supportent les profils audio encodés
    // Cette fonction peut être étendue selon les capacités du SDK
    // Le client est passé pour une utilisation future avec setEncoderConfiguration

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
