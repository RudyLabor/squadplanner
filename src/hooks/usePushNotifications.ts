import { create } from 'zustand'
import { Capacitor } from '@capacitor/core'
import { PushNotifications, type Token, type PushNotificationSchema, type ActionPerformed } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { supabase } from '../lib/supabase'
import { useVoiceCallStore } from './useVoiceCall'

// Check if running on native platform
const isNativePlatform = Capacitor.isNativePlatform()

// VAPID public key from environment (for web push)
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY
console.log('[Push] VAPID key configured:', VAPID_PUBLIC_KEY ? 'Yes (' + VAPID_PUBLIC_KEY.substring(0, 20) + '...)' : 'NO - MISSING!')

// Interface pour les messages du Service Worker
interface ServiceWorkerMessage {
  type: 'CALL_ACTION' | string
  action?: 'answer' | 'decline'
  callId?: string
  callerId?: string
}

interface PushNotificationState {
  isSupported: boolean
  isServiceWorkerRegistered: boolean
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
  subscription: PushSubscription | null
  registration: ServiceWorkerRegistration | null

  // Actions
  registerServiceWorker: () => Promise<ServiceWorkerRegistration | null>
  subscribeToPush: (userId: string) => Promise<boolean>
  unsubscribeFromPush: (userId: string) => Promise<boolean>
  checkSubscription: (userId: string) => Promise<boolean>
  sendTestNotification: () => Promise<void>
}

// Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Convert ArrayBuffer to base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

export const usePushNotificationStore = create<PushNotificationState>((set, get) => ({
  isSupported: 'serviceWorker' in navigator && 'PushManager' in window,
  isServiceWorkerRegistered: false,
  isSubscribed: false,
  isLoading: false,
  error: null,
  subscription: null,
  registration: null,

  registerServiceWorker: async () => {
    if (!get().isSupported) {
      set({ error: 'Push notifications not supported in this browser' })
      return null
    }

    try {
      set({ isLoading: true, error: null })

      // Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('[Push] Service worker registered:', registration.scope)

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready

      set({
        isServiceWorkerRegistered: true,
        registration,
        isLoading: false
      })

      return registration
    } catch (error) {
      console.error('[Push] Service worker registration failed:', error)
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to register service worker'
      })
      return null
    }
  },

  subscribeToPush: async (userId: string) => {
    const { isSupported, registration } = get()

    if (!isSupported) {
      set({ error: 'Push notifications not supported' })
      return false
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error('[Push] VAPID_PUBLIC_KEY not configured')
      set({ error: 'Push notifications not configured (missing VAPID key)' })
      return false
    }

    try {
      set({ isLoading: true, error: null })

      // Get or create service worker registration
      let swRegistration = registration
      if (!swRegistration) {
        swRegistration = await get().registerServiceWorker()
        if (!swRegistration) {
          return false
        }
      }

      // Request notification permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        set({
          isLoading: false,
          error: 'Notification permission denied'
        })
        return false
      }

      // Check for existing subscription and unsubscribe if VAPID key changed
      const existingSubscription = await swRegistration.pushManager.getSubscription()
      if (existingSubscription) {
        try {
          await existingSubscription.unsubscribe()
          console.log('[Push] Unsubscribed from old subscription')
          // Also remove from database
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', userId)
        } catch (e) {
          console.warn('[Push] Failed to unsubscribe old subscription:', e)
        }
      }

      // Subscribe to push notifications with new VAPID key
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      })

      console.log('[Push] Subscribed:', subscription.endpoint)

      // Extract keys from subscription
      const p256dh = subscription.getKey('p256dh')
      const auth = subscription.getKey('auth')

      if (!p256dh || !auth) {
        throw new Error('Failed to get subscription keys')
      }

      // Save subscription to Supabase
      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: arrayBufferToBase64(p256dh),
          auth: arrayBufferToBase64(auth)
        }, {
          onConflict: 'user_id,endpoint'
        })

      if (dbError) {
        console.error('[Push] Failed to save subscription:', dbError)
        throw dbError
      }

      console.log('[Push] Subscription saved to database')

      set({
        isSubscribed: true,
        subscription,
        isLoading: false
      })

      return true
    } catch (error) {
      console.error('[Push] Subscription failed:', error)
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe to push notifications'
      })
      return false
    }
  },

  unsubscribeFromPush: async (userId: string) => {
    const { subscription } = get()

    try {
      set({ isLoading: true, error: null })

      // Unsubscribe from push
      if (subscription) {
        await subscription.unsubscribe()
      }

      // Remove from database
      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)

      if (dbError) {
        console.error('[Push] Failed to delete subscription:', dbError)
      }

      console.log('[Push] Unsubscribed')

      set({
        isSubscribed: false,
        subscription: null,
        isLoading: false
      })

      return true
    } catch (error) {
      console.error('[Push] Unsubscribe failed:', error)
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to unsubscribe'
      })
      return false
    }
  },

  checkSubscription: async (userId: string) => {
    const { registration } = get()

    if (!registration) {
      return false
    }

    try {
      // Check if we have an active subscription
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Verify it exists in database
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', userId)
          .eq('endpoint', subscription.endpoint)
          .single()

        if (!error && data) {
          set({ isSubscribed: true, subscription })
          return true
        }
      }

      set({ isSubscribed: false, subscription: null })
      return false
    } catch (error) {
      console.error('[Push] Check subscription failed:', error)
      return false
    }
  },

  sendTestNotification: async () => {
    const { registration } = get()

    if (!registration) {
      console.error('[Push] No service worker registration')
      return
    }

    // Send a local test notification via service worker
    await registration.showNotification('Test SquadPlanner', {
      body: 'Les notifications push fonctionnent !',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'test-notification',
      data: {
        url: '/'
      }
    })
  }
}))

// Hook for easier use in components
export const usePushNotifications = () => {
  const store = usePushNotificationStore()

  return {
    isSupported: store.isSupported,
    isRegistered: store.isServiceWorkerRegistered,
    isSubscribed: store.isSubscribed,
    isLoading: store.isLoading,
    error: store.error,
    register: store.registerServiceWorker,
    subscribe: store.subscribeToPush,
    unsubscribe: store.unsubscribeFromPush,
    checkSubscription: store.checkSubscription,
    sendTestNotification: store.sendTestNotification
  }
}

// Gestionnaire des messages du Service Worker pour les actions d'appel
function handleServiceWorkerMessage(event: MessageEvent<ServiceWorkerMessage>) {
  console.log('[Push] Message from SW:', event.data)

  if (event.data?.type === 'CALL_ACTION') {
    const { action, callId } = event.data
    const voiceCallStore = useVoiceCallStore.getState()

    console.log('[Push] Call action received:', action, 'callId:', callId)

    if (action === 'answer') {
      // L'utilisateur a clique sur "Repondre" depuis la notification push
      // Le modal d'appel entrant devrait deja etre affiche via Realtime
      // On accepte directement l'appel
      if (voiceCallStore.status === 'ringing' && voiceCallStore.currentCallId === callId) {
        voiceCallStore.acceptCall()
      } else {
        console.log('[Push] Call state mismatch, status:', voiceCallStore.status, 'expected callId:', callId)
      }
    } else if (action === 'decline') {
      // L'utilisateur a clique sur "Refuser" depuis la notification push
      if (voiceCallStore.status === 'ringing' && voiceCallStore.currentCallId === callId) {
        voiceCallStore.rejectCall()
      } else {
        // Si l'appel n'est pas en cours de sonnerie, on essaie de le rejeter via Supabase
        if (callId) {
          supabase
            .from('calls')
            .update({ status: 'rejected' })
            .eq('id', callId)
            .then(({ error }) => {
              if (error) console.error('[Push] Failed to reject call:', error)
              else console.log('[Push] Call rejected via database')
            })
        }
      }
    }
  }
}

// Function to initialize push notifications at app startup
export async function initializePushNotifications(): Promise<void> {
  const store = usePushNotificationStore.getState()

  if (!store.isSupported) {
    console.log('[Push] Push notifications not supported')
    return
  }

  try {
    // Register service worker
    const registration = await store.registerServiceWorker()

    if (registration) {
      console.log('[Push] Service worker ready')

      // Ecouter les messages du Service Worker pour les actions d'appel
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
      console.log('[Push] Service worker message listener registered')

      // If user is logged in, check their subscription
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await store.checkSubscription(session.user.id)
      }
    }
  } catch (error) {
    console.error('[Push] Initialization failed:', error)
  }
}

// Fonction pour retirer le listener (cleanup)
export function cleanupPushNotifications(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
    console.log('[Push] Service worker message listener removed')
  }
}

// =====================================================
// NATIVE PUSH NOTIFICATIONS (Capacitor iOS/Android)
// =====================================================

// Save native push token to database
async function saveNativeTokenToDatabase(token: string, userId: string) {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token: token,
        platform: Capacitor.getPlatform(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,token'
      })

    if (error) {
      console.error('[NativePush] Error saving token:', error)
    } else {
      console.log('[NativePush] Token saved to database')
    }
  } catch (error) {
    console.error('[NativePush] Error saving token:', error)
  }
}

// Handle native notification received while app is open
async function handleNativeNotificationReceived(notification: PushNotificationSchema) {
  console.log('[NativePush] Notification received:', notification)

  const notifType = notification.data?.type as string

  // Vibrate based on notification type
  if (notifType === 'party_invite' || notifType === 'call') {
    // Strong vibration for party invites / calls (like a phone call)
    await Haptics.notification({ type: NotificationType.Warning })

    // Show persistent notification with sound
    await LocalNotifications.schedule({
      notifications: [{
        id: Date.now(),
        title: notification.title || 'Invitation Party',
        body: notification.body || 'Tu es invité à rejoindre une Party',
        sound: 'ringtone.wav',
        ongoing: true,
        autoCancel: false,
        extra: notification.data
      }]
    })
  } else {
    // Light vibration for other notifications
    await Haptics.impact({ style: ImpactStyle.Medium })
  }
}

// Handle native notification tap (app was in background)
function handleNativeNotificationAction(action: ActionPerformed) {
  console.log('[NativePush] Notification action:', action)

  const data = action.notification.data
  const notifType = data?.type as string

  // Navigate based on notification type
  switch (notifType) {
    case 'party_invite':
    case 'call':
      window.location.href = `/party?squad=${data?.squad_id}`
      break
    case 'message':
      window.location.href = `/messages?squad=${data?.squad_id}`
      break
    case 'session_reminder':
      window.location.href = `/squad/${data?.squad_id}`
      break
    case 'squad_invite':
      window.location.href = '/squads'
      break
    default:
      window.location.href = '/home'
  }
}

// Register native push notifications
export async function registerNativePushNotifications(userId: string): Promise<boolean> {
  if (!isNativePlatform) {
    console.log('[NativePush] Not a native platform')
    return false
  }

  try {
    // Check permissions
    let permStatus = await PushNotifications.checkPermissions()

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions()
    }

    if (permStatus.receive !== 'granted') {
      console.error('[NativePush] Permission denied')
      return false
    }

    // Set up listeners
    await PushNotifications.addListener('registration', async (token: Token) => {
      console.log('[NativePush] Registration successful, token:', token.value)
      await saveNativeTokenToDatabase(token.value, userId)
    })

    await PushNotifications.addListener('registrationError', (error) => {
      console.error('[NativePush] Registration error:', error)
    })

    await PushNotifications.addListener('pushNotificationReceived', handleNativeNotificationReceived)
    await PushNotifications.addListener('pushNotificationActionPerformed', handleNativeNotificationAction)

    // Register with APNS/FCM
    await PushNotifications.register()
    console.log('[NativePush] Registered for push notifications')

    return true
  } catch (error) {
    console.error('[NativePush] Registration failed:', error)
    return false
  }
}

// Helper function to trigger haptic feedback
export async function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') {
  if (!isNativePlatform) {
    // Fallback to web vibration API
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10)
          break
        case 'medium':
          navigator.vibrate(25)
          break
        case 'heavy':
          navigator.vibrate(50)
          break
        case 'success':
          navigator.vibrate([10, 50, 10])
          break
        case 'warning':
        case 'error':
          navigator.vibrate([50, 100, 50])
          break
      }
    }
    return
  }

  try {
    switch (type) {
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light })
        break
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium })
        break
      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy })
        break
      case 'success':
        await Haptics.notification({ type: NotificationType.Success })
        break
      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning })
        break
      case 'error':
        await Haptics.notification({ type: NotificationType.Error })
        break
    }
  } catch (error) {
    console.warn('[Haptics] Error:', error)
  }
}

// Check if running on native platform
export function isNative(): boolean {
  return isNativePlatform
}

// Initialize push notifications (call at app startup)
export async function initializeAllPushNotifications(userId?: string): Promise<void> {
  if (isNativePlatform && userId) {
    // Native platform: use Capacitor push
    await registerNativePushNotifications(userId)
  } else {
    // Web platform: use service worker push
    await initializePushNotifications()
  }
}
