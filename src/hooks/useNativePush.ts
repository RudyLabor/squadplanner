import { supabase } from '../lib/supabase'

const isNativePlatform = !!(globalThis as any).Capacitor?.isNativePlatform?.()

async function saveNativeTokenToDatabase(token: string, userId: string) {
  try {
    const { Capacitor } = await import('@capacitor/core')
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token: token,
        platform: Capacitor.getPlatform(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,token' })

    if (!import.meta.env.PROD) {
      if (error) console.warn('[NativePush] Error saving token:', error)
      else console.log('[NativePush] Token saved to database')
    }
  } catch (error) {
    if (!import.meta.env.PROD) console.warn('[NativePush] Error saving token:', error)
  }
}

async function handleNativeNotificationReceived(notification: any) {
  if (!import.meta.env.PROD) console.log('[NativePush] Notification received:', notification)

  const notifType = notification.data?.type as string
  const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics')

  if (notifType === 'party_invite' || notifType === 'call') {
    await Haptics.notification({ type: NotificationType.Warning })
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.schedule({
      notifications: [{
        id: Date.now(),
        title: notification.title || 'Invitation Party',
        body: notification.body || 'Tu es invite a rejoindre une Party',
        sound: 'ringtone.wav',
        ongoing: true,
        autoCancel: false,
        extra: notification.data
      }]
    })
  } else {
    await Haptics.impact({ style: ImpactStyle.Medium })
  }
}

function handleNativeNotificationAction(action: any) {
  if (!import.meta.env.PROD) console.log('[NativePush] Notification action:', action)
  const data = action.notification.data
  const notifType = data?.type as string

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

export async function registerNativePushNotifications(userId: string): Promise<boolean> {
  if (!isNativePlatform) return false

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    let permStatus = await PushNotifications.checkPermissions()
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions()
    }
    if (permStatus.receive !== 'granted') return false

    await PushNotifications.addListener('registration', async (token: any) => {
      if (!import.meta.env.PROD) console.log('[NativePush] Registration successful, token:', token.value)
      await saveNativeTokenToDatabase(token.value, userId)
    })
    await PushNotifications.addListener('registrationError', (error) => {
      if (!import.meta.env.PROD) console.warn('[NativePush] Registration error:', error)
    })
    await PushNotifications.addListener('pushNotificationReceived', handleNativeNotificationReceived)
    await PushNotifications.addListener('pushNotificationActionPerformed', handleNativeNotificationAction)

    await PushNotifications.register()
    return true
  } catch (error) {
    if (!import.meta.env.PROD) console.warn('[NativePush] Registration failed:', error)
    return false
  }
}

export async function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') {
  if (!isNativePlatform) {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light': navigator.vibrate(10); break
        case 'medium': navigator.vibrate(25); break
        case 'heavy': navigator.vibrate(50); break
        case 'success': navigator.vibrate([10, 50, 10]); break
        case 'warning':
        case 'error': navigator.vibrate([50, 100, 50]); break
      }
    }
    return
  }

  try {
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics')
    switch (type) {
      case 'light': await Haptics.impact({ style: ImpactStyle.Light }); break
      case 'medium': await Haptics.impact({ style: ImpactStyle.Medium }); break
      case 'heavy': await Haptics.impact({ style: ImpactStyle.Heavy }); break
      case 'success': await Haptics.notification({ type: NotificationType.Success }); break
      case 'warning': await Haptics.notification({ type: NotificationType.Warning }); break
      case 'error': await Haptics.notification({ type: NotificationType.Error }); break
    }
  } catch (error) {
    console.warn('[Haptics] Error:', error)
  }
}

export function isNative(): boolean {
  return isNativePlatform
}
