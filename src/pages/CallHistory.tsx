
import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Phone, ArrowLeft, RefreshCw } from '../components/icons'
import { useNavigate } from 'react-router'
import { Card, Button } from '../components/ui'
import { MobilePageHeader } from '../components/layout/MobilePageHeader'
import { useCallHistoryStore, type CallType } from '../hooks/useCallHistory'
// LAZY LOAD: useVoiceCall importé uniquement si call button cliqué  
// import { useVoiceCallStore } from '../hooks/useVoiceCall'
import { CallHistoryList } from './call-history/CallHistoryList'

function CallToast({
  message,
  isVisible,
  onClose,
}: {
  message: string
  isVisible: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 2500)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-success text-bg-base font-medium shadow-lg shadow-glow-success">
            <Phone className="w-5 h-5" />
            <span>{message}</span>
          </div>
        </div>
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
  const { isLoading, error, filter, fetchCallHistory, setFilter, getFilteredCalls } =
    useCallHistoryStore()
  // LAZY LOAD: useVoiceCall sera importé dans handleCall
  // const { startCall, status: callStatus } = useVoiceCallStore()
  const callStatus = 'idle' as const // Default — real status injected lazily in handleCall

  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const filteredCalls = getFilteredCalls()

  useEffect(() => {
    fetchCallHistory()
  }, [fetchCallHistory])

  const handleCall = async (
    contactId: string,
    contactName: string,
    contactAvatar: string | null
  ) => {
    // LAZY LOAD: Import voice call uniquement au clic d'appel
    const { useVoiceCallStore } = await import('../hooks/useVoiceCall')
    const { startCall, status: callStatus } = useVoiceCallStore.getState()
    
    if (callStatus !== 'idle') return
    setToastMessage(`📞 Appel vers ${contactName}...`)
    setShowToast(true)
    await startCall(contactId, contactName, contactAvatar)
  }

  const totalCalls = filteredCalls.length
  const hasMore = totalCalls > 10

  return (
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Historique d'appels">
      <MobilePageHeader title="Appels" />
      <CallToast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      <header className="sticky top-0 z-10 bg-bg-base/95 backdrop-blur-lg border-b border-border-default">
        <div className="px-4 py-4 max-w-4xl lg:max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="hidden lg:flex w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-surface-card items-center justify-center hover:bg-border-default hover:scale-[1.02] transition-interactive touch-target"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5 text-text-primary" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-text-primary">Tes appels récents</h1>
              <p className="text-base text-text-tertiary">
                {totalCalls > 0
                  ? hasMore
                    ? `${totalCalls} appel${totalCalls !== 1 ? 's' : ''}`
                    : `${totalCalls} appel${totalCalls !== 1 ? 's' : ''}`
                  : 'Aucun appel pour le moment'}
              </p>
            </div>
            <button
              onClick={() => fetchCallHistory()}
              disabled={isLoading}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-surface-card flex items-center justify-center hover:bg-border-default hover:scale-[1.02] transition-interactive disabled:opacity-50 touch-target"
              aria-label="Rafraîchir"
            >
              <RefreshCw
                className={`w-5 h-5 text-text-tertiary ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

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
      </header>

      <div className="px-4 py-4 max-w-4xl lg:max-w-5xl mx-auto">
        {isLoading && filteredCalls.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-md text-text-tertiary">Chargement de l'historique...</p>
          </div>
        )}

        {error && (
          <Card className="p-4 bg-error/5 border-error/10">
            <p className="text-md text-error">{error}</p>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => fetchCallHistory()}>
              Réessayer
            </Button>
          </Card>
        )}

        {!isLoading && !error && (
          <CallHistoryList
            filteredCalls={filteredCalls}
            filter={filter}
            callStatus={callStatus}
            onCall={handleCall}
          />
        )}
      </div>
    </main>
  )
}

export default CallHistory
