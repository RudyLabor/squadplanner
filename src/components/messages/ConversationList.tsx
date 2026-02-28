import { memo } from 'react'
import { Users, Gamepad2, User, Search } from '../icons'
import { ConversationListSkeleton } from '../VirtualizedMessageList'
import { EmptyState } from '../EmptyState'
import { formatTime } from './utils'

export interface SquadConversation {
  id: string
  name: string
  type: 'squad' | 'session'
  squad_id: string
  session_id?: string
  last_message?: {
    content: string
    created_at: string
    sender?: { username?: string; avatar_url?: string | null }
  }
  unread_count: number
}

export interface DMConversation {
  other_user_id: string
  other_user_username: string
  other_user_avatar_url: string | null
  last_message_content: string | null
  last_message_at: string | null
  last_message_sender_id: string | null
  unread_count: number
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary-bg text-white text-xs font-bold rounded-full flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  )
}

const ConversationCard = memo(function ConversationCard({
  conversation: c,
  onClick,
  isActive,
}: {
  conversation: SquadConversation
  onClick: () => void
  isActive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-xl text-left transition-interactive ${isActive ? 'bg-primary-15 border border-primary' : 'hover:bg-bg-surface border border-transparent'}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${c.type === 'session' ? 'bg-warning-15' : 'bg-primary-15'}`}
        >
          {c.type === 'session' ? (
            <Gamepad2 className="w-5 h-5 text-warning" />
          ) : (
            <Users className="w-5 h-5 text-primary" />
          )}
          <UnreadBadge count={c.unread_count} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h3
              className={`text-md font-medium truncate ${c.unread_count > 0 ? 'text-text-primary' : 'text-text-secondary'}`}
            >
              {c.name || 'Conversation'}
            </h3>
            {c.last_message?.created_at && (
              <span className="text-xs text-text-quaternary flex-shrink-0 ml-2">
                {formatTime(c.last_message.created_at)}
              </span>
            )}
          </div>
          <p
            className={`text-base truncate ${c.unread_count > 0 ? 'text-text-tertiary' : 'text-text-quaternary'}`}
          >
            {c.last_message ? (
              <>
                <span className="text-text-tertiary">
                  {c.last_message.sender?.username || 'Utilisateur'}:
                </span>{' '}
                {/* UX-4: Show placeholder when content is empty or just the username */}
                {c.last_message.content &&
                c.last_message.content !== c.last_message.sender?.username
                  ? c.last_message.content
                  : 'Message...'}
              </>
            ) : (
              <span className="italic">Aucun message</span>
            )}
          </p>
        </div>
      </div>
    </button>
  )
})

const DMConversationCard = memo(function DMConversationCard({
  conversation: c,
  onClick,
}: {
  conversation: DMConversation
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-xl text-left transition-interactive hover:bg-bg-surface border border-transparent"
    >
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-primary-15">
          {c.other_user_avatar_url ? (
            <img
              src={c.other_user_avatar_url}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="text-md font-bold text-primary">
              {(c.other_user_username || '?').charAt(0).toUpperCase()}
            </span>
          )}
          <UnreadBadge count={c.unread_count} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h3
              className={`text-md font-medium truncate ${c.unread_count > 0 ? 'text-text-primary' : 'text-text-secondary'}`}
            >
              {c.other_user_username}
            </h3>
            {c.last_message_at && (
              <span className="text-xs text-text-quaternary flex-shrink-0 ml-2">
                {formatTime(c.last_message_at)}
              </span>
            )}
          </div>
          <p
            className={`text-base truncate ${c.unread_count > 0 ? 'text-text-tertiary' : 'text-text-quaternary'}`}
          >
            {c.last_message_content || <span className="italic">Dis-lui bonjour\u00a0!</span>}
          </p>
        </div>
      </div>
    </button>
  )
})

interface Props {
  showOnDesktop?: boolean
  activeTab: 'squads' | 'dms'
  onTabChange: (tab: 'squads' | 'dms') => void
  searchQuery: string
  onSearchChange: (q: string) => void
  isLoading: boolean
  squadConversations: SquadConversation[]
  dmConversations: DMConversation[]
  filteredSquadConvs: SquadConversation[]
  filteredDMConvs: DMConversation[]
  activeSquadConvId?: string
  isDesktop: boolean
  squadUnread: number
  dmUnread: number
  totalUnread: number
  onSelectSquadConv: (c: SquadConversation) => void
  onSelectDMConv: (c: DMConversation | null) => void
}

function TabBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="min-w-[18px] h-[18px] px-1 bg-primary-bg text-white text-xs font-bold rounded-full flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  )
}

export function ConversationList({
  showOnDesktop = false,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  isLoading,
  squadConversations,
  dmConversations,
  filteredSquadConvs,
  filteredDMConvs,
  activeSquadConvId,
  isDesktop,
  squadUnread,
  dmUnread,
  totalUnread,
  onSelectSquadConv,
  onSelectDMConv,
}: Props) {
  const tabCls = (active: boolean) =>
    `flex-1 py-2.5 px-4 rounded-lg text-base font-medium transition-interactive flex items-center justify-center gap-2 ${active ? 'bg-bg-hover text-text-primary' : 'text-text-tertiary hover:text-text-primary'}`

  return (
    <div className={showOnDesktop ? 'h-full flex flex-col' : ''}>
      <header className={showOnDesktop ? 'p-4 pl-5' : 'mb-5'}>
        <div className="flex items-center justify-between mb-1">
          <h1 className={`font-bold text-text-primary ${showOnDesktop ? 'text-xl' : 'text-2xl'}`}>
            Messages
          </h1>
          {totalUnread > 0 && (
            <span className="px-2.5 py-1 bg-primary-bg text-white text-sm font-bold rounded-full">
              {totalUnread} non lu{totalUnread > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      <div
        className={`flex gap-1 p-1 bg-bg-surface rounded-xl ${showOnDesktop ? 'mx-4 mb-3' : 'mb-5'}`}
        role="tablist"
        aria-label="Type de conversations"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'squads'}
          onClick={() => onTabChange('squads')}
          className={tabCls(activeTab === 'squads')}
        >
          <Users className="w-4 h-4" />
          Squads
          <TabBadge count={squadUnread} />
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'dms'}
          onClick={() => onTabChange('dms')}
          className={tabCls(activeTab === 'dms')}
        >
          <User className="w-4 h-4" />
          Privés
          <TabBadge count={dmUnread} />
        </button>
      </div>

      <div className={`relative ${showOnDesktop ? 'mx-4 mb-3' : 'mb-5'}`}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-quaternary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            activeTab === 'squads' ? 'Rechercher une squad...' : 'Rechercher un contact...'
          }
          aria-label="Rechercher une conversation"
          className="w-full h-11 pl-10 pr-4 bg-bg-surface border border-border-default rounded-xl text-md text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className={showOnDesktop ? 'flex-1 overflow-y-auto px-4 pb-4' : ''}>
        {isLoading ? (
          <ConversationListSkeleton count={6} type={activeTab === 'squads' ? 'squad' : 'dm'} />
        ) : activeTab === 'squads' ? (
          squadConversations.length === 0 ? (
            <EmptyState
              type="no_squads"
              title="Tes potes discutent sans toi"
              message="Rejoins une squad pour ne plus rater aucune conversation."
              actionLabel="Voir mes squads"
              onAction={() => (window.location.href = '/squads')}
            />
          ) : filteredSquadConvs.length === 0 ? (
            <EmptyState
              type="no_search_results"
              title="Aucune squad trouvée"
              message="Essaie avec d'autres mots-clés"
            />
          ) : (
            <div className="space-y-1">
              {filteredSquadConvs.map((c) => (
                <ConversationCard
                  key={c.id}
                  conversation={c}
                  onClick={() => onSelectSquadConv(c)}
                  isActive={isDesktop && activeSquadConvId === c.id}
                />
              ))}
            </div>
          )
        ) : dmConversations.length === 0 ? (
          <EmptyState
            type="no_messages"
            title="Envoie le premier message"
            message="Clique sur un membre de ta squad pour lancer la conversation \u2014 c'est souvent comme \u00e7a que les meilleures sessions commencent."
            actionLabel="Voir mes squads"
            onAction={() => (window.location.href = '/squads')}
          />
        ) : filteredDMConvs.length === 0 ? (
          <EmptyState
            type="no_search_results"
            title="Aucun contact trouvé"
            message="Essaie avec d'autres mots-clés"
          />
        ) : (
          <div className="space-y-1">
            {filteredDMConvs.map((c) => (
              <DMConversationCard
                key={c.other_user_id}
                conversation={c}
                onClick={() => onSelectDMConv(c)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
