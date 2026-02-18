import { create } from 'zustand'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'

function getNotificationUrl(type: string, data: Record<string, unknown>): string {
  switch (type) {
    case 'party_invite':
    case 'party_started':
      return '/party'
    case 'new_message':
    case 'new_dm':
      return '/messages'
    case 'session_created':
      return data.squad_id ? `/squad/${data.squad_id}` : '/sessions'
    default:
      return '/'
  }
}

interface NotificationState {
  isSupported: boolean
  isPermissionGranted: boolean
  isLoading: boolean
  error: string | null

  // Actions
  requestPermission: () => Promise<boolean>
  sendNotification: (title: string, options?: NotificationOptions) => void
  subscribeToSessionReminders: (userId: string) => void
  unsubscribe: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  isSupported: typeof window !== 'undefined' && 'Notification' in window,
  isPermissionGranted:
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted',
  isLoading: false,
  error: null,

  requestPermission: async () => {
    if (!get().isSupported) {
      set({ error: 'Les notifications ne sont pas supportées par ce navigateur' })
      return false
    }

    try {
      set({ isLoading: true, error: null })
      const permission = await Notification.requestPermission()
      const granted = permission === 'granted'
      set({ isPermissionGranted: granted, isLoading: false })

      if (!granted) {
        set({ error: 'Permission de notification refusée' })
      }

      return granted
    } catch (error) {
      console.warn('[Notifications] Error requesting permission:', error)
      set({
        isLoading: false,
        error: 'Erreur lors de la demande de permission',
      })
      return false
    }
  },

  sendNotification: (title: string, options?: NotificationOptions) => {
    const { isSupported, isPermissionGranted } = get()

    if (!isSupported || !isPermissionGranted) {
      console.warn('Notifications not available')
      return
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      })

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000)

      // Handle click
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (error) {
      console.warn('[Notifications] Error sending:', error)
    }
  },

  subscribeToSessionReminders: (userId: string) => {
    // Subscribe to session changes for reminders
    const sessionChannel = supabase
      .channel('session-reminders')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `status=eq.confirmed`,
        },
        (payload) => {
          const session = payload.new as {
            id: string
            title: string
            scheduled_at: string
            status: string
          }

          const sessionTime = new Date(session.scheduled_at)
          const now = new Date()
          const minutesUntil = (sessionTime.getTime() - now.getTime()) / (1000 * 60)

          if (minutesUntil > 0 && minutesUntil <= 15) {
            get().sendNotification('Session bientôt !', {
              body: `${session.title || 'Ta session'} commence dans ${Math.round(minutesUntil)} minutes`,
              tag: `session-${session.id}`,
              requireInteraction: true,
            })
          }
        }
      )
      .subscribe()

    // Subscribe to notifications table inserts for this user (party invites, messages, sessions, etc.)
    const notifChannel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notif = payload.new as {
            id: string
            type: string
            title: string
            message: string
            data: Record<string, unknown>
          }
          // Show in-app notification toast for all types
          get().sendNotification(notif.title, {
            body: notif.message || '',
            tag: `notif-${notif.id}`,
            data: { url: getNotificationUrl(notif.type, notif.data), ...notif.data },
          })
        }
      )
      .subscribe()

    // Store channel references for cleanup
    ;(window as { _notificationChannels?: Array<typeof sessionChannel> })._notificationChannels = [
      sessionChannel,
      notifChannel,
    ]
  },

  unsubscribe: () => {
    const channels = (
      window as { _notificationChannels?: Array<ReturnType<typeof supabase.channel>> }
    )._notificationChannels
    if (channels) {
      channels.forEach((ch) => supabase.removeChannel(ch))
    }
  },
}))

// Hook for session-specific notifications
export const useSessionNotifications = () => {
  const { sendNotification, isPermissionGranted } = useNotificationStore()

  const notifyRsvpReceived = (username: string, response: string) => {
    if (!isPermissionGranted) return

    const responseText =
      response === 'present'
        ? 'sera présent'
        : response === 'maybe'
          ? 'est incertain'
          : 'sera absent'

    sendNotification('Nouvelle réponse', {
      body: `${username} ${responseText}`,
      tag: 'rsvp-update',
    })
  }

  const notifySessionConfirmed = (sessionTitle: string) => {
    if (!isPermissionGranted) return

    sendNotification('Session confirmée !', {
      body: `${sessionTitle} est confirmée. Prépare-toi !`,
      tag: 'session-confirmed',
    })
  }

  const notifySessionStarting = (sessionTitle: string, minutesUntil: number) => {
    if (!isPermissionGranted) return

    sendNotification('Session imminente', {
      body: `${sessionTitle} commence dans ${minutesUntil} minute${minutesUntil > 1 ? 's' : ''}`,
      tag: 'session-starting',
      requireInteraction: true,
    })
  }

  return {
    notifyRsvpReceived,
    notifySessionConfirmed,
    notifySessionStarting,
  }
}
