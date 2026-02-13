import { create } from 'zustand'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribeToSessionReminders: (_userId: string) => {
    // Subscribe to session_rsvps changes for this user (userId reserved for future per-user filtering)
    // When a session is about to start, send a notification
    const channel = supabase
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

          // Check if session is starting soon (within 15 minutes)
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

    // Store channel reference for cleanup
    ;(window as { _notificationChannel?: typeof channel })._notificationChannel = channel
  },

  unsubscribe: () => {
    const channel = (window as { _notificationChannel?: ReturnType<typeof supabase.channel> })
      ._notificationChannel
    if (channel) {
      supabase.removeChannel(channel)
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
