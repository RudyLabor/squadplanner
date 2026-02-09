import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, X } from 'lucide-react'
import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../hooks'

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
      const { data: rsvps } = await supabase
        .from('session_rsvps')
        .select('id, response, updated_at, sessions!inner(title, scheduled_at, squad_id, squads!inner(name))')
        .neq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(20)

      const notifs: AppNotification[] = (rsvps || []).map((r: any) => ({
        id: r.id,
        type: 'rsvp' as const,
        title: r.sessions?.squads?.name || 'Squad',
        body: `Nouveau RSVP sur "${r.sessions?.title || 'Session'}"`,
        read: false,
        created_at: r.updated_at,
        squad_id: r.sessions?.squad_id,
        session_id: undefined,
      }))

      set({
        notifications: notifs,
        unreadCount: notifs.filter(n => !n.read).length,
        isLoading: false,
      })
    } catch {
      set({ isLoading: false })
    }
  },

  markAsRead: (id: string) => {
    const { notifications } = get()
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n)
    set({ notifications: updated, unreadCount: updated.filter(n => !n.read).length })
  },

  markAllAsRead: () => {
    const { notifications } = get()
    set({ notifications: notifications.map(n => ({ ...n, read: true })), unreadCount: 0 })
  },
}))

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthStore()
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore()

  useEffect(() => {
    if (user) fetchNotifications(user.id)
  }, [user, fetchNotifications])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen])

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
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-[#8b8d90] hover:text-[#f7f8f8] hover:bg-border-subtle transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#fb7185] text-white text-[10px] font-bold flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 max-h-96 rounded-xl bg-[#0f1012] border border-border-default shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
              <h3 className="text-[14px] font-semibold text-[#f7f8f8]">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[12px] text-[#6366f1] hover:text-[#a78bfa] transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-[#5e6063] hover:text-[#f7f8f8] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-72">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-[#5e6063] mx-auto mb-2" />
                  <p className="text-[13px] text-[#5e6063]">Aucune notification</p>
                </div>
              ) : (
                notifications.slice(0, 15).map(notif => (
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
                        <span className="w-2 h-2 rounded-full bg-[#6366f1] mt-1.5 flex-shrink-0" />
                      )}
                      <div className={`flex-1 min-w-0 ${notif.read ? 'ml-5' : ''}`}>
                        <p className="text-[13px] font-medium text-[#f7f8f8] truncate">{notif.title}</p>
                        <p className="text-[12px] text-[#8b8d90] truncate">{notif.body}</p>
                      </div>
                      <span className="text-[11px] text-[#5e6063] flex-shrink-0">{formatTime(notif.created_at)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
