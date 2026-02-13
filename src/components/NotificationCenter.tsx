
import { useEffect, useCallback, useRef } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, X } from './icons'
import { create } from 'zustand'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { useAuthStore } from '../hooks'
import { useOverlayStore } from '../hooks/useOverlayStore'

interface AppNotification {
  id: string
  type: 'rsvp' | 'session' | 'squad' | 'reminder' | 'system'
  title: string
  body: string
  read: boolean
  created_at: string
  squad_id?: string
  session_id?: string
}

interface NotificationStore {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean
  fetchNotifications: (userId: string) => Promise<void>
  markAsRead: (id: string) => void
  markAllAsRead: () => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (userId: string) => {
    try {
      set({ isLoading: true })
      // Fetch recent session RSVPs as notifications
      // Step 1: fetch rsvps (no joins — PostgREST !inner returns 400)
      const { data: rsvps } = await supabase
        .from('session_rsvps')
        .select('id, session_id, response, responded_at')
        .neq('user_id', userId)
        .order('responded_at', { ascending: false })
        .limit(20)

      if (!rsvps || rsvps.length === 0) {
        set({ notifications: [], unreadCount: 0, isLoading: false })
        return
      }

      // Step 2: batch-fetch session details
      const sessionIds = [...new Set(rsvps.map((r) => r.session_id))]
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, title, scheduled_at, squad_id')
        .in('id', sessionIds)
      const sessionMap = new Map(
        (sessions || []).map((s) => [s.id, s])
      )

      // Step 3: batch-fetch squad names
      const squadIds = [
        ...new Set((sessions || []).map((s) => s.squad_id).filter(Boolean)),
      ]
      const squadMap = new Map<string, string>()
      if (squadIds.length > 0) {
        const { data: squads } = await supabase.from('squads').select('id, name').in('id', squadIds)
        squads?.forEach((s) => squadMap.set(s.id, s.name))
      }

      const notifs: AppNotification[] = rsvps.map((r) => {
        const sess = sessionMap.get(r.session_id)
        return {
          id: r.id,
          type: 'rsvp' as const,
          title: squadMap.get(sess?.squad_id ?? '') || 'Squad',
          body: `Nouveau RSVP sur "${sess?.title || 'Session'}"`,
          read: false,
          created_at: r.responded_at,
          squad_id: sess?.squad_id,
          session_id: r.session_id,
        }
      })

      set({
        notifications: notifs,
        unreadCount: notifs.filter((n) => !n.read).length,
        isLoading: false,
      })
    } catch {
      set({ isLoading: false })
    }
  },

  markAsRead: (id: string) => {
    const { notifications } = get()
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    set({ notifications: updated, unreadCount: updated.filter((n) => !n.read).length })
  },

  markAllAsRead: () => {
    const { notifications } = get()
    set({ notifications: notifications.map((n) => ({ ...n, read: true })), unreadCount: 0 })
  },
}))

export function NotificationBell() {
  const panelRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthStore()
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } =
    useNotificationStore()
  const { activeOverlay, toggle, close } = useOverlayStore()
  const isOpen = activeOverlay === 'notifications'

  useEffect(() => {
    if (user) fetchNotifications(user.id)
  }, [user, fetchNotifications])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        close('notifications')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, close])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close('notifications')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, close])

  const formatTime = useCallback((date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "À l'instant"
    if (mins < 60) return `${mins}min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    return `${Math.floor(hours / 24)}j`
  }, [])

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => toggle('notifications')}
        className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-border-subtle transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <m.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-error text-white text-xs font-bold flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </m.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 max-h-96 rounded-xl bg-bg-surface border border-border-default shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
              <h3 className="text-md font-semibold text-text-primary">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-sm text-primary hover:text-purple transition-colors"
                    aria-label="Tout marquer comme lu"
                  >
                    <CheckCheck className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => close('notifications')}
                  className="text-text-tertiary hover:text-text-primary transition-colors"
                  aria-label="Fermer les notifications"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-72">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                  <p className="text-base text-text-tertiary">Aucune notification</p>
                </div>
              ) : (
                notifications.slice(0, 15).map((notif) => (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => markAsRead(notif.id)}
                    className={`w-full text-left px-4 py-3 border-b border-border-subtle hover:bg-surface-card transition-colors ${
                      !notif.read ? 'bg-primary-5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      )}
                      <div className={`flex-1 min-w-0 ${notif.read ? 'ml-5' : ''}`}>
                        <p className="text-base font-medium text-text-primary truncate">
                          {notif.title}
                        </p>
                        <p className="text-sm text-text-secondary truncate">{notif.body}</p>
                      </div>
                      <span className="text-sm text-text-tertiary flex-shrink-0">
                        {formatTime(notif.created_at)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
