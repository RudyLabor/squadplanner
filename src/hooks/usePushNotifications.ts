import { create } from 'zustand'
import { supabase } from '../lib/supabase'
export { registerNativePushNotifications, triggerHaptic, isNative } from './useNativePush'
import { registerNativePushNotifications } from './useNativePush'

const isNativePlatform = !!(globalThis as any).Capacitor?.isNativePlatform?.()

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY
if (!import.meta.env.PROD) {
  console.log('[Push] VAPID key configured:', VAPID_PUBLIC_KEY ? 'Yes (' + VAPID_PUBLIC_KEY.substring(0, 20) + '...)' : 'NO - MISSING!')
}

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
  registerServiceWorker: () => Promise<ServiceWorkerRegistration | null>
  subscribeToPush: (userId: string) => Promise<boolean>
  unsubscribeFromPush: (userId: string) => Promise<boolean>
  checkSubscription: (userId: string) => Promise<boolean>
  sendTestNotification: () => Promise<void>
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export const usePushNotificationStore = create<PushNotificationState>((set, get) => ({
  isSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window,
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
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready
      set({ isServiceWorkerRegistered: true, registration, isLoading: false })
      return registration
    } catch (error) {
      console.warn('[Push] Service worker registration failed:', error)
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to register service worker' })
      return null
    }
  },

  subscribeToPush: async (userId: string) => {
    const { isSupported, registration } = get()
    if (!isSupported) { set({ error: 'Push notifications not supported' }); return false }
    if (!VAPID_PUBLIC_KEY) { set({ error: 'Push notifications not configured (missing VAPID key)' }); return false }

    try {
      set({ isLoading: true, error: null })
      let swRegistration = registration
      if (!swRegistration) {
        swRegistration = await get().registerServiceWorker()
        if (!swRegistration) return false
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        set({ isLoading: false, error: 'Notification permission denied' })
        return false
      }

      const existingSubscription = await swRegistration.pushManager.getSubscription()
      if (existingSubscription) {
        try {
          await existingSubscription.unsubscribe()
          await supabase.from('push_subscriptions').delete().eq('user_id', userId)
        } catch (e) {
          if (!import.meta.env.PROD) console.warn('[Push] Failed to unsubscribe old subscription:', e)
        }
      }

      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      })

      const p256dh = subscription.getKey('p256dh')
      const auth = subscription.getKey('auth')
      if (!p256dh || !auth) throw new Error('Failed to get subscription keys')

      const { error: dbError } = await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64(p256dh),
        auth: arrayBufferToBase64(auth)
      }, { onConflict: 'user_id,endpoint' })

      if (dbError) throw dbError

      set({ isSubscribed: true, subscription, isLoading: false })
      return true
    } catch (error) {
      if (!import.meta.env.PROD) console.warn('[Push] Subscription failed:', error)
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to subscribe to push notifications' })
      return false
    }
  },

  unsubscribeFromPush: async (userId: string) => {
    const { subscription } = get()
    try {
      set({ isLoading: true, error: null })
      if (subscription) await subscription.unsubscribe()
      await supabase.from('push_subscriptions').delete().eq('user_id', userId)
      set({ isSubscribed: false, subscription: null, isLoading: false })
      return true
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to unsubscribe' })
      return false
    }
  },

  checkSubscription: async (userId: string) => {
    const { registration } = get()
    if (!registration) return false
    try {
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        const { data, error } = await supabase.from('push_subscriptions')
          .select('id').eq('user_id', userId).eq('endpoint', subscription.endpoint).single()
        if (!error && data) { set({ isSubscribed: true, subscription }); return true }
      }
      set({ isSubscribed: false, subscription: null })
      return false
    } catch { return false }
  },

  sendTestNotification: async () => {
    const { registration } = get()
    if (!registration) return
    await registration.showNotification('Test SquadPlanner', {
      body: 'Les notifications push fonctionnent !',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'test-notification',
      data: { url: '/' }
    })
  }
}))

export const usePushNotifications = () => {
  const store = usePushNotificationStore()
  return {
    isSupported: store.isSupported, isRegistered: store.isServiceWorkerRegistered,
    isSubscribed: store.isSubscribed, isLoading: store.isLoading, error: store.error,
    register: store.registerServiceWorker, subscribe: store.subscribeToPush,
    unsubscribe: store.unsubscribeFromPush, checkSubscription: store.checkSubscription,
    sendTestNotification: store.sendTestNotification
  }
}

async function handleServiceWorkerMessage(event: MessageEvent<ServiceWorkerMessage>) {
  if (event.data?.type === 'CALL_ACTION') {
    const { action, callId } = event.data
    const { useVoiceCallStore } = await import('./useVoiceCall')
    const voiceCallStore = useVoiceCallStore.getState()

    if (action === 'answer') {
      if (voiceCallStore.status === 'ringing' && voiceCallStore.currentCallId === callId) {
        voiceCallStore.acceptCall()
      }
    } else if (action === 'decline') {
      if (voiceCallStore.status === 'ringing' && voiceCallStore.currentCallId === callId) {
        voiceCallStore.rejectCall()
      } else if (callId) {
        supabase.from('calls').update({ status: 'rejected' }).eq('id', callId).then(() => {})
      }
    }
  }
}

export async function initializePushNotifications(): Promise<void> {
  const store = usePushNotificationStore.getState()
  if (!store.isSupported) return

  try {
    const registration = await store.registerServiceWorker()
    if (registration) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) await store.checkSubscription(session.user.id)
    }
  } catch (error) {
    if (!import.meta.env.PROD) console.warn('[Push] Initialization failed:', error)
  }
}

export function cleanupPushNotifications(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
  }
}

export async function initializeAllPushNotifications(userId?: string): Promise<void> {
  if (isNativePlatform && userId) {
    await registerNativePushNotifications(userId)
  } else {
    await initializePushNotifications()
  }
}
