import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  ArrowLeft, User, RefreshCw, UserPlus
} from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, Button } from '../components/ui'
import { useCallHistoryStore, formatDuration, formatRelativeTime, type CallType } from '../hooks/useCallHistory'
import { useVoiceCallStore } from '../hooks/useVoiceCall'

// Toast component
function CallToast({ message, isVisible, onClose }: { message: string; isVisible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 2500)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-success text-bg-base font-medium shadow-lg shadow-glow-success">
            <Phone className="w-5 h-5" />
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const filterOptions: { value: CallType; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'incoming', label: 'Entrants' },
  { value: 'outgoing', label: 'Sortants' },
  { value: 'missed', label: 'Manqués' },
]

export function CallHistory() {
  const navigate = useNavigate()
  const {
    isLoading,
    error,
    filter,
    fetchCallHistory,
    setFilter,
    getFilteredCalls
  } = useCallHistoryStore()
  const { startCall, status: callStatus } = useVoiceCallStore()

  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const filteredCalls = getFilteredCalls()

  useEffect(() => {
    fetchCallHistory()
  }, [fetchCallHistory])

  const handleCall = async (contactId: string, contactName: string, contactAvatar: string | null) => {
    if (callStatus !== 'idle') return
    setToastMessage(`📞 Appel vers ${contactName}...`)
    setShowToast(true)
    await startCall(contactId, contactName, contactAvatar)
  }

  const getCallIcon = (type: 'incoming' | 'outgoing', status: string) => {
    if (status === 'missed' || status === 'rejected') {
      return <PhoneMissed className="w-5 h-5 text-error" />
    }
    if (type === 'incoming') {
      return <PhoneIncoming className="w-5 h-5 text-success" />
    }
    return <PhoneOutgoing className="w-5 h-5 text-primary" />
  }

  const getCallLabel = (type: 'incoming' | 'outgoing', status: string) => {
    if (status === 'missed') return 'Appel manqué'
    if (status === 'rejected') return 'Appel rejeté'
    if (type === 'incoming') return 'Appel entrant'
    return 'Appel sortant'
  }

  return (
    <div className="min-h-0 bg-bg-base pb-6">
      {/* Toast */}
      <CallToast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-base/95 backdrop-blur-lg border-b border-border-default">
        <div className="px-4 py-4 max-w-4xl lg:max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-surface-card flex items-center justify-center hover:bg-border-default hover:scale-[1.02] transition-interactive touch-target"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5 text-text-primary" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-text-primary">Tes appels récents</h1>
              <p className="text-base text-text-tertiary">
                {filteredCalls.length > 0
                  ? `${filteredCalls.length} appel${filteredCalls.length !== 1 ? 's' : ''}`
                  : 'Aucun appel pour le moment'
                }
              </p>
            </div>
            <button
              onClick={() => fetchCallHistory()}
              disabled={isLoading}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-surface-card flex items-center justify-center hover:bg-border-default hover:scale-[1.02] transition-interactive disabled:opacity-50 touch-target"
              aria-label="Rafraichir"
            >
              <RefreshCw className={`w-5 h-5 text-text-tertiary ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2.5 min-h-[44px] rounded-xl text-base font-medium whitespace-nowrap transition-interactive touch-target ${
                  filter === option.value
                    ? 'bg-primary text-white'
                    : 'bg-surface-card text-text-tertiary hover:bg-border-default hover:text-text-primary hover:scale-[1.02]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 max-w-4xl lg:max-w-5xl mx-auto">
        {/* Loading state */}
        {isLoading && filteredCalls.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-md text-text-tertiary">Chargement de l'historique...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <Card className="p-4 bg-error/5 border-error/10">
            <p className="text-md text-error">{error}</p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2"
              onClick={() => fetchCallHistory()}
            >
              Réessayer
            </Button>
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredCalls.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/[0.08] to-primary/[0.02] flex items-center justify-center mb-5">
              <Phone className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              {filter === 'all' ? 'Pas encore d\'appels' : 'Aucun appel ici'}
            </h3>
            <p className="text-md text-text-tertiary text-center max-w-[260px] mb-6">
              {filter === 'all'
                ? "Appelle un pote pour commencer ! Tes appels apparaîtront ici."
                : `Aucun appel ${
                    filter === 'incoming' ? 'entrant' :
                    filter === 'outgoing' ? 'sortant' : 'manqué'
                  } pour le moment`
              }
            </p>
            {filter === 'all' && (
              <Link to="/messages">
                <Button variant="secondary">
                  <UserPlus className="w-4 h-4" />
                  Voir mes contacts
                </Button>
              </Link>
            )}
          </motion.div>
        )}

        {/* Call list */}
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {filteredCalls.map((call, index) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className="p-4 bg-bg-surface hover:bg-bg-hover transition-colors"
                  hoverable
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple flex items-center justify-center overflow-hidden">
                        {call.contactAvatar ? (
                          <img
                            src={call.contactAvatar}
                            alt={call.contactName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                      {/* Call type indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-bg-surface ${
                        call.status === 'missed' || call.status === 'rejected'
                          ? 'bg-error'
                          : call.type === 'incoming'
                            ? 'bg-success'
                            : 'bg-primary'
                      }`}>
                        {call.status === 'missed' || call.status === 'rejected' ? (
                          <PhoneMissed className="w-3 h-3 text-white" />
                        ) : call.type === 'incoming' ? (
                          <PhoneIncoming className="w-3 h-3 text-white" />
                        ) : (
                          <PhoneOutgoing className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Call info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className={`text-md font-semibold truncate ${
                          call.status === 'missed' || call.status === 'rejected'
                            ? 'text-error'
                            : 'text-text-primary'
                        }`}>
                          {call.contactName}
                        </h3>
                        <span className="text-base text-text-tertiary flex-shrink-0 ml-2">
                          {formatRelativeTime(call.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-base text-text-tertiary">
                        {getCallIcon(call.type, call.status)}
                        <span>{getCallLabel(call.type, call.status)}</span>
                        {typeof call.durationSeconds === 'number' && call.durationSeconds > 0 && (
                          <>
                            <span className="text-text-tertiary">•</span>
                            <span>{formatDuration(call.durationSeconds)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Call button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCall(call.contactId, call.contactName, call.contactAvatar)
                      }}
                      disabled={callStatus !== 'idle'}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-success-10 flex items-center justify-center hover:bg-success-10 hover:scale-[1.02] transition-interactive disabled:opacity-50 disabled:cursor-not-allowed touch-target"
                      aria-label={`Appeler ${call.contactName}`}
                    >
                      <Phone className="w-5 h-5 text-success" aria-hidden="true" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default CallHistory
