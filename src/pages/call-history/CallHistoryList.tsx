import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import {
  Phone,
  PhoneIncoming,
  PhoneMissed,
  ArrowUpRight,
  ArrowUp,
  User,
  X,
  Loader2,
} from '../../components/icons'
import { Link } from 'react-router'
import { Card, Button } from '../../components/ui'
import { Tooltip } from '../../components/ui/Tooltip'
import { formatDuration, formatRelativeTime } from '../../hooks/useCallHistory'

const PAGE_SIZE = 10

interface CallEntry {
  id: string
  type: 'incoming' | 'outgoing'
  status: string
  contactId: string
  contactName: string
  contactAvatar: string | null
  durationSeconds: number | null
  createdAt: Date | string
}

interface CallHistoryListProps {
  filteredCalls: CallEntry[]
  filter: string
  callStatus: string
  onCall: (contactId: string, contactName: string, contactAvatar: string | null) => void
}

export function CallHistoryList({
  filteredCalls,
  filter,
  callStatus,
  onCall,
}: CallHistoryListProps) {
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const totalCalls = filteredCalls.length
  const hasMore = displayCount < totalCalls

  useEffect(() => {
    setDisplayCount(PAGE_SIZE)
  }, [filter])

  useEffect(() => {
    const sentinel = loadMoreRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, totalCalls))
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, totalCalls])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const getCallIcon = (type: 'incoming' | 'outgoing', status: string) => {
    if (status === 'missed') return <PhoneMissed className="w-4 h-4 text-error" />
    if (status === 'rejected') return <X className="w-4 h-4 text-warning" />
    if (type === 'incoming') return <PhoneIncoming className="w-4 h-4 text-success" />
    return <ArrowUpRight className="w-4 h-4 text-primary" />
  }

  const getCallLabel = (type: 'incoming' | 'outgoing', status: string) => {
    if (status === 'missed') return 'Manqué'
    if (status === 'rejected') return 'Rejeté'
    if (type === 'incoming') return 'Entrant'
    return 'Sortant'
  }

  const getCallLabelColor = (type: 'incoming' | 'outgoing', status: string) => {
    if (status === 'missed') return 'text-error'
    if (status === 'rejected') return 'text-warning'
    if (type === 'incoming') return 'text-success'
    return 'text-primary'
  }

  const groupedCalls = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 86400000)
    const thisWeekStart = new Date(today.getTime() - today.getDay() * 86400000)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const groups: { label: string; calls: typeof filteredCalls }[] = []
    const buckets: Record<string, typeof filteredCalls> = {
      "Aujourd'hui": [],
      Hier: [],
      'Cette semaine': [],
      'Ce mois': [],
      'Plus ancien': [],
    }

    for (const call of filteredCalls) {
      const callDate = new Date(call.createdAt)
      if (callDate >= today) buckets["Aujourd'hui"].push(call)
      else if (callDate >= yesterday) buckets['Hier'].push(call)
      else if (callDate >= thisWeekStart) buckets['Cette semaine'].push(call)
      else if (callDate >= thisMonthStart) buckets['Ce mois'].push(call)
      else buckets['Plus ancien'].push(call)
    }

    for (const [label, calls] of Object.entries(buckets)) {
      if (calls.length > 0) groups.push({ label, calls })
    }
    return groups
  }, [filteredCalls])

  const truncatedGroups = useMemo(() => {
    let remaining = displayCount
    const result: typeof groupedCalls = []
    for (const group of groupedCalls) {
      if (remaining <= 0) break
      if (group.calls.length <= remaining) {
        result.push(group)
        remaining -= group.calls.length
      } else {
        result.push({ label: group.label, calls: group.calls.slice(0, remaining) })
        remaining = 0
      }
    }
    return result
  }, [groupedCalls, displayCount])

  if (filteredCalls.length === 0) {
    return (
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <m.div
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-success/5 flex items-center justify-center mb-5"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Phone className="w-10 h-10 text-primary" />
        </m.div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {filter === 'all' ? 'Prêt à appeler ta squad ?' : 'Rien pour le moment'}
        </h3>
        <p className="text-md text-text-tertiary text-center max-w-[280px] mb-6">
          {filter === 'all'
            ? 'Lance un appel vocal avec tes potes depuis la party !'
            : `Aucun appel ${filter === 'incoming' ? 'entrant' : filter === 'outgoing' ? 'sortant' : 'manqué'} pour le moment`}
        </p>
        {filter === 'all' && (
          <Link to="/party">
            <Button variant="secondary">
              <Phone className="w-4 h-4" />
              Aller en party vocale
            </Button>
          </Link>
        )}
      </m.div>
    )
  }

  return (
    <>
      <AnimatePresence mode="popLayout">
        <div className="space-y-4">
          {truncatedGroups.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-3 mb-2 mt-2">
                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>
              <div className="space-y-2">
                {group.calls.map((call, index) => (
                  <m.div
                    key={call.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card
                      className="p-4 bg-bg-elevated hover:bg-overlay-light transition-colors"
                      hoverable
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple flex items-center justify-center overflow-hidden">
                            {call.contactAvatar ? (
                              <img
                                src={call.contactAvatar}
                                alt={call.contactName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <User className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-bg-base ${
                              call.status === 'missed'
                                ? 'bg-error'
                                : call.status === 'rejected'
                                  ? 'bg-warning'
                                  : call.type === 'incoming'
                                    ? 'bg-success'
                                    : 'bg-primary-bg'
                            }`}
                          >
                            {call.status === 'missed' ? (
                              <PhoneMissed className="w-3 h-3 text-white" />
                            ) : call.status === 'rejected' ? (
                              <X className="w-3 h-3 text-white" />
                            ) : call.type === 'incoming' ? (
                              <PhoneIncoming className="w-3 h-3 text-white" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h3
                              className={`text-md font-semibold truncate ${
                                call.status === 'missed'
                                  ? 'text-error'
                                  : call.status === 'rejected'
                                    ? 'text-warning'
                                    : 'text-text-primary'
                              }`}
                            >
                              {call.contactName}
                            </h3>
                            <span className="text-base text-text-tertiary flex-shrink-0 ml-2">
                              {formatRelativeTime(
                                call.createdAt instanceof Date
                                  ? call.createdAt
                                  : new Date(call.createdAt)
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-base">
                            {getCallIcon(call.type, call.status)}
                            <span
                              className={`text-sm font-medium ${getCallLabelColor(call.type, call.status)}`}
                            >
                              {getCallLabel(call.type, call.status)}
                            </span>
                            {typeof call.durationSeconds === 'number' &&
                              call.durationSeconds > 0 && (
                                <>
                                  <span className="text-text-tertiary">·</span>
                                  <span className="text-text-tertiary">
                                    {formatDuration(call.durationSeconds)}
                                  </span>
                                </>
                              )}
                          </div>
                        </div>
                        <Tooltip content="Rappeler" position="left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onCall(call.contactId, call.contactName, call.contactAvatar)
                            }}
                            disabled={callStatus !== 'idle'}
                            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-success-10 flex items-center justify-center hover:bg-success/15 hover:scale-[1.02] transition-interactive disabled:opacity-50 disabled:cursor-not-allowed touch-target"
                            aria-label={`Appeler ${call.contactName}`}
                          >
                            <Phone className="w-5 h-5 text-success" aria-hidden="true" />
                          </button>
                        </Tooltip>
                      </div>
                    </Card>
                  </m.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </AnimatePresence>

      {totalCalls > 0 && (
        <div ref={loadMoreRef} className="flex items-center justify-center py-6">
          {hasMore ? (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-text-tertiary"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Chargement...</span>
            </m.div>
          ) : (
            <m.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-text-tertiary text-center"
            >
              Tu as vu tous tes appels
            </m.p>
          )}
        </div>
      )}

      <AnimatePresence>
        {showScrollTop && (
          <m.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={scrollToTop}
            className="fixed bottom-24 right-4 z-40 w-11 h-11 rounded-full bg-primary-bg text-white shadow-lg shadow-primary/25 flex items-center justify-center hover:bg-primary-dark hover:scale-105 transition-interactive"
            aria-label="Remonter en haut"
          >
            <ArrowUp className="w-5 h-5" />
          </m.button>
        )}
      </AnimatePresence>
    </>
  )
}
