export { useAuthStore } from './useAuth'
export { useSquadsStore } from './useSquads'
export { useSessionsStore } from './useSessions'
export { useMessagesStore } from './useMessages'
export { useDirectMessagesStore } from './useDirectMessages'
export { useAIStore, useAI } from './useAI'
export { useSubscriptionStore } from './useSubscription'
// IMPORTANT: Voice chat hooks now use native WebRTC (LiveKit removed)
// Import directly where needed:
//   import { useVoiceChatStore, ... } from '../hooks/useVoiceChat'  
//   import { useVoiceCallStore, ... } from '../hooks/useVoiceCall'
export { useNotificationStore, useSessionNotifications } from './useNotifications'
export {
  usePushNotificationStore,
  usePushNotifications,
  initializePushNotifications,
} from './usePushNotifications'
export {
  usePremiumStore,
  usePremium,
  FREE_SQUAD_LIMIT,
  FREE_HISTORY_DAYS,
  PREMIUM_PRICE_MONTHLY,
  PREMIUM_PRICE_YEARLY,
} from './usePremium'
export type { PremiumFeature } from './usePremium'
export { useCallHistoryStore, formatDuration, formatRelativeTime } from './useCallHistory'
export type { CallType, CallRecord, CallHistoryItem } from './useCallHistory'
// useNetworkQuality now uses native WebRTC — import directly where needed:  
//   import { useNetworkQualityStore, ... } from '../hooks/useNetworkQuality'
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
export { useSquadNotificationsStore, useSquadNotifications } from './useSquadNotifications'
export { useThemeStore } from './useTheme'
export type { ThemeMode } from './useTheme'
export {
  useViewTransitionNavigate,
  isViewTransitionSupported,
  withViewTransition,
} from './useViewTransition'
export { useConfetti } from './useConfetti'

// PHASE 5.4 - Realtime presence
export { usePresence, useUserOnlineStatus, getOnlineIndicatorClasses } from './usePresence'
export type { PresenceUser, OnlineIndicatorProps } from './usePresence'

// PHASE 4.2 - Global presence + User status
export {
  useGlobalPresence,
  useGlobalPresenceStore,
  updatePresenceActivity,
} from './useGlobalPresence'
export type { GlobalPresenceUser } from './useGlobalPresence'
export { useUserStatusStore, AVAILABILITY_CONFIG } from './useUserStatus'
export type { AvailabilityStatus, CustomStatus, GameStatus } from './useUserStatus'

// PHASE 1.1 - React Query hooks
export * from './queries'

// PHASE 5.2 - PWA install prompt
export { usePWAInstallStore } from './usePWAInstall'

// Offline detection
export { useOffline, useOfflineBanner, useOfflineStore } from './useOffline'

// Chantier 9 - Session expiry detection
export { useSessionExpiry } from './useSessionExpiry'

// Focus management for accessibility
export {
  useFocusOnNavigate,
  useFocusTrap as useFocusTrapManaged,
  useRestoreFocus,
  useAnnounce,
  useSkipLink,
  useAutoFocus,
  useRovingTabindex,
  useA11yAnnouncements,
} from './useFocusManagement'

// Chantier 9 - Auto retry with exponential backoff
export { useAutoRetry } from './useAutoRetry'

// Chantier 9 - Rate limit detection store
export { useRateLimitStore } from './useRateLimit'

// Chantier 12 - Reduced motion preference
export { useReducedMotion } from './useReducedMotion'

// Chantier 12 - Navigation progress
export { useNavigationProgress, useNavigationProgressStore } from './useNavigationProgress'

// Chantier 12 - Delayed loading (prevents flash-of-spinner)
export { useDelayedLoading } from './useDelayedLoading'

// Chantier 12 - State persistence & navigation polish
export { useStatePersistence } from './useStatePersistence'
export { useHashNavigation } from './useHashNavigation'
export { useInfiniteScroll } from './useInfiniteScroll'

// Chantier 12 - Adaptive loading & prefetch
export { useAdaptiveLoading } from './useAdaptiveLoading'
export type { QualityTier } from './useAdaptiveLoading'
export { usePrefetch } from './usePrefetch'

// Referral system
export { useReferralStore, useReferral } from './useReferral'
export type { ReferralStats, ReferralHistoryItem } from './useReferral'

// Analytics tracking
export { useAnalytics } from './useAnalytics'

// App resume lifecycle (replaces entry.client.tsx reload mechanisms)
export { useAppResume } from './useAppResume'

// Deep linking: import directly from './useDeepLink' where needed (native-only, not in barrel)
