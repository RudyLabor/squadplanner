import {
  ArrowLeft,
  Users,
  Gamepad2,
  Search,
  Phone,
} from '../icons'
import { m, AnimatePresence } from 'framer-motion'
import { useVoiceCallStore } from '../../hooks/useVoiceCall'

interface SquadConvHeader {
  type: 'squad' | 'session'
  name: string
}

interface DMConvHeader {
  other_user_id: string
  other_user_username: string
  other_user_avatar_url: string | null
}

interface ConversationHeaderProps {
  embedded: boolean
  isSquadChat: boolean
  squadConv: SquadConvHeader | null
  dmConv: DMConvHeader | null
  chatName: string
  chatSubtitle: string
  showMessageSearch: boolean
  messageSearchQuery: string
  messageSearchCount: number
  onBack: () => void
  onToggleSearch: () => void
  onSearchChange: (query: string) => void
}

export function ConversationHeader({
  embedded,
  isSquadChat,
  squadConv,
  dmConv,
  chatName,
  chatSubtitle,
  showMessageSearch,
  messageSearchQuery,
  messageSearchCount,
  onBack,
  onToggleSearch,
  onSearchChange,
}: ConversationHeaderProps) {
  return (
    <>
      <div className={`flex-shrink-0 px-4 py-3 border-b border-border-default ${embedded ? '' : 'bg-bg-elevated/80 backdrop-blur-xl sticky top-0 z-10'}`}>
        <div className={`flex items-center gap-3 ${embedded ? '' : 'max-w-4xl lg:max-w-5xl mx-auto'}`}>
          {!embedded && (
            <button onClick={onBack} aria-label="Retour" className="p-2 -ml-2 rounded-xl hover:bg-surface-card-hover transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-tertiary" aria-hidden="true" />
            </button>
          )}

          {isSquadChat && squadConv ? (
            <>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                squadConv.type === 'session' ? 'bg-warning-15' : 'bg-primary-15'
              }`}>
                {squadConv.type === 'session' ? (
                  <Gamepad2 className="w-5 h-5 text-warning" />
                ) : (
                  <Users className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-md font-semibold text-text-primary truncate">{chatName}</h2>
                <p className="text-sm text-text-quaternary">{chatSubtitle}</p>
              </div>
              <button
                onClick={onToggleSearch}
                className={`p-2.5 rounded-xl transition-colors ${showMessageSearch ? 'bg-primary-15 text-primary' : 'hover:bg-surface-card-hover text-text-tertiary'}`}
                aria-label="Rechercher dans les messages"
              >
                <Search className="w-5 h-5" />
              </button>
            </>
          ) : dmConv ? (
            <>
              <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden bg-primary-15">
                {dmConv.other_user_avatar_url ? (
                  <img src={dmConv.other_user_avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <span className="text-md font-bold text-primary">
                    {(dmConv.other_user_username || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-md font-semibold text-text-primary truncate">{chatName}</h2>
                <p className="text-sm text-text-quaternary">{chatSubtitle}</p>
              </div>
              <button
                onClick={() => {
                  useVoiceCallStore.getState().startCall(
                    dmConv.other_user_id,
                    dmConv.other_user_username,
                    dmConv.other_user_avatar_url
                  )
                }}
                className="p-2.5 rounded-xl bg-success-10 hover:bg-success-20 transition-colors"
                aria-label={`Appeler ${dmConv.other_user_username}`}
              >
                <Phone className="w-5 h-5 text-success" aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Message Search Bar */}
      <AnimatePresence>
        {showMessageSearch && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border-subtle"
          >
            <div className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-quaternary" />
                <input
                  type="text"
                  value={messageSearchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Rechercher dans les messages..."
                  className="w-full h-9 pl-9 pr-3 bg-border-subtle border border-border-default rounded-lg text-base text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-primary"
                  autoFocus
                />
                {messageSearchQuery && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-quaternary">
                    {messageSearchCount} résultat(s)
                  </span>
                )}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}
