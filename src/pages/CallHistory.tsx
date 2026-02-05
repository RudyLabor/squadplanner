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
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#4ade80] text-[#08090a] font-medium shadow-lg">
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
      return <PhoneMissed className="w-5 h-5 text-[#f87171]" />
    }
    if (type === 'incoming') {
      return <PhoneIncoming className="w-5 h-5 text-[#4ade80]" />
    }
    return <PhoneOutgoing className="w-5 h-5 text-[#5e6dd2]" />
  }

  const getCallLabel = (type: 'incoming' | 'outgoing', status: string) => {
    if (status === 'missed') return 'Appel manqué'
    if (status === 'rejected') return 'Appel rejeté'
    if (type === 'incoming') return 'Appel entrant'
    return 'Appel sortant'
  }

  return (
    <div className="min-h-0 bg-[#08090a] pb-6">
      {/* Toast */}
      <CallToast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#08090a]/95 backdrop-blur-lg border-b border-[rgba(255,255,255,0.06)]">
        <div className="px-4 py-4 max-w-4xl lg:max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.06)] transition-colors touch-target"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5 text-[#f7f8f8]" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#f7f8f8]">Tes appels récents</h1>
              <p className="text-[13px] text-[#888]">
                {filteredCalls.length > 0
                  ? `${filteredCalls.length} appel${filteredCalls.length !== 1 ? 's' : ''}`
                  : 'Aucun appel pour le moment'
                }
              </p>
            </div>
            <button
              onClick={() => fetchCallHistory()}
              disabled={isLoading}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.06)] transition-colors disabled:opacity-50 touch-target"
              aria-label="Rafraichir"
            >
              <RefreshCw className={`w-5 h-5 text-[#888] ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2.5 min-h-[44px] rounded-xl text-[13px] font-medium whitespace-nowrap transition-all touch-target ${
                  filter === option.value
                    ? 'bg-[#5e6dd2] text-white'
                    : 'bg-[rgba(255,255,255,0.03)] text-[#888] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f7f8f8]'
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
            <div className="w-10 h-10 border-2 border-[#5e6dd2] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[14px] text-[#888]">Chargement de l'historique...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <Card className="p-4 bg-[rgba(248,113,113,0.1)] border-[rgba(248,113,113,0.2)]">
            <p className="text-[14px] text-[#f87171]">{error}</p>
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
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[rgba(94,109,210,0.15)] to-[rgba(94,109,210,0.05)] flex items-center justify-center mb-5">
              <Phone className="w-10 h-10 text-[#5e6dd2]" />
            </div>
            <h3 className="text-[18px] font-semibold text-[#f7f8f8] mb-2">
              {filter === 'all' ? 'Pas encore d\'appels' : 'Aucun appel ici'}
            </h3>
            <p className="text-[14px] text-[#888] text-center max-w-[260px] mb-6">
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
                  className="p-4 bg-[#101012] hover:bg-[#18191b] transition-colors"
                  hoverable
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5e6dd2] to-[#8b93ff] flex items-center justify-center overflow-hidden">
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
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#101012] ${
                        call.status === 'missed' || call.status === 'rejected'
                          ? 'bg-[#f87171]'
                          : call.type === 'incoming'
                            ? 'bg-[#4ade80]'
                            : 'bg-[#5e6dd2]'
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
                        <h3 className={`text-[15px] font-semibold truncate ${
                          call.status === 'missed' || call.status === 'rejected'
                            ? 'text-[#f87171]'
                            : 'text-[#f7f8f8]'
                        }`}>
                          {call.contactName}
                        </h3>
                        <span className="text-[13px] text-[#888] flex-shrink-0 ml-2">
                          {formatRelativeTime(call.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[13px] text-[#888]">
                        {getCallIcon(call.type, call.status)}
                        <span>{getCallLabel(call.type, call.status)}</span>
                        {call.durationSeconds && call.durationSeconds > 0 && (
                          <>
                            <span className="text-[#5e6063]">•</span>
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
                      className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[rgba(74,222,128,0.1)] flex items-center justify-center hover:bg-[rgba(74,222,128,0.2)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target"
                      aria-label={`Appeler ${call.contactName}`}
                    >
                      <Phone className="w-5 h-5 text-[#4ade80]" aria-hidden="true" />
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
