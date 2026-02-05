import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// VAPID public key from environment
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

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

      // Subscribe to push notifications
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
