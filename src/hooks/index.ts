export { useAuthStore } from './useAuth'
export { useSquadsStore } from './useSquads'
export { useSessionsStore } from './useSessions'
export { useMessagesStore } from './useMessages'
export { useDirectMessagesStore } from './useDirectMessages'
export { useAIStore, useAI } from './useAI'
export { useSubscriptionStore } from './useSubscription'
export { useVoiceChatStore, useSessionVoiceChat, getSavedPartyInfo } from './useVoiceChat'
export { useVoiceCallStore, subscribeToIncomingCalls, formatCallDuration } from './useVoiceCall'
export { useNotificationStore, useSessionNotifications } from './useNotifications'
export { usePushNotificationStore, usePushNotifications, initializePushNotifications } from './usePushNotifications'
export { usePremiumStore, usePremium, FREE_SQUAD_LIMIT, FREE_HISTORY_DAYS, PREMIUM_PRICE_MONTHLY, PREMIUM_PRICE_YEARLY } from './usePremium'
export type { PremiumFeature } from './usePremium'
export { useCallHistoryStore, formatDuration, formatRelativeTime } from './useCallHistory'
export type { CallType, CallRecord, CallHistoryItem } from './useCallHistory'
export {
  useNetworkQualityStore,
  useNetworkQuality,
  setupNetworkQualityListener,
  adjustAudioQuality,
  AUDIO_PROFILES,
  QUALITY_INFO,
  mapAgoraQualityToLevel
} from './useNetworkQuality'
export type { NetworkQualityLevel, AudioProfile } from './useNetworkQuality'
export { useFocusTrap } from './useFocusTrap'
export { useParticipantVolumes } from './useParticipantVolumes'
export type { ParticipantVolumeState, StoredVolumes } from './useParticipantVolumes'
export { useAudioAnalyser } from './useAudioAnalyser'
export type { AudioAnalyserData } from './useAudioAnalyser'
export { useHapticFeedback } from './useHapticFeedback'
export { useSoundEffects } from './useSoundEffects'
export { useRingtone, playNotificationSound } from './useRingtone'
export { useKeyboardVisible } from './useKeyboardVisible'
export { useUnreadCountStore } from './useUnreadCount'
export { useThemeStore } from './useTheme'
export type { ThemeMode } from './useTheme'
export { useViewTransitionNavigate, isViewTransitionSupported, withViewTransition } from './useViewTransition'

// PHASE 5.4 - Realtime presence
export { usePresence, useUserOnlineStatus, getOnlineIndicatorClasses } from './usePresence'
export type { PresenceUser, OnlineIndicatorProps } from './usePresence'

// PHASE 1.1 - React Query hooks
export * from './queries'
