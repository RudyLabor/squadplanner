import { memo } from 'react'
import { motion } from 'framer-motion'
import { MessageStatus } from '../MessageStatus'
import { MessageActions } from '../MessageActions'
import { MessageReactions } from '../MessageReactions'
import { MessageReplyPreview } from '../MessageReplyPreview'
import { MessageContent } from '../MessageContent'
import { RoleBadge } from '../RoleBadge'
import { formatTime } from './utils'

function SystemMessage({ message }: { message: { id: string; content: string; created_at: string } }) {
  const c = message.content.toLowerCase()
  const isCelebration = c.includes('confirme') || c.includes('rejoint') || c.includes('bienvenue') || c.includes('present')
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, type: 'spring', stiffness: 200, damping: 20 }} className="flex justify-center my-3">
      <p className={`text-base italic text-center px-4 py-1.5 rounded-full ${isCelebration ? 'bg-gradient-to-r from-primary-15 to-purple-15 text-primary-light border border-primary' : 'text-text-tertiary'}`}>
        {isCelebration && <span className="mr-1">🎉</span>}— {message.content} —
      </p>
    </motion.div>
  )
}

export interface MessageBubbleMessage {
  id: string; content: string; created_at: string; is_system_message?: boolean; is_pinned?: boolean
  edited_at?: string | null; sender_id: string; sender?: { username?: string; avatar_url?: string | null }
  reply_to_id?: string | null; read_by?: string[]; read_at?: string | null
}

export interface ReplyToData {
  id: string; sender_id: string; sender_username: string; sender_avatar?: string; content: string
}

interface Props {
  message: MessageBubbleMessage; isOwn: boolean; showAvatar: boolean; showName: boolean
  currentUserId: string; isSquadChat: boolean; isAdmin: boolean
  onEdit: (m: { id: string; content: string }) => void; onDelete: (id: string) => void
  onPin: (id: string, pinned: boolean) => void
  onReply: (m: { id: string; content: string; sender: string }) => void
  onForward: (m: { content: string; sender: string }) => void
  onPollVote: (id: string, idx: number) => void
  replyToMessage?: ReplyToData | null; onScrollToMessage?: (id: string) => void; senderRole?: string
}

export const MessageBubble = memo(function MessageBubble({
  message, isOwn, showAvatar, showName, currentUserId, isSquadChat, isAdmin,
  onEdit, onDelete, onPin, onReply, onForward, onPollVote, replyToMessage, onScrollToMessage, senderRole,
}: Props) {
  if (!message || !message.id) return null
  if (message.is_system_message) return <SystemMessage message={message} />

  const initial = message.sender?.username?.charAt(0).toUpperCase() || '?'
  const sender = message.sender?.username || 'Utilisateur'
  const content = message.content || ''
  const actions = {
    message: { id: message.id, sender_id: message.sender_id || '', content },
    currentUserId, isAdmin,
    onEdit: () => onEdit({ id: message.id, content }),
    onDelete: () => onDelete(message.id),
    onPin: () => onPin(message.id, !message.is_pinned),
    onReply: () => onReply({ id: message.id, content, sender }),
    onForward: () => onForward({ content, sender }),
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
      className={`group flex ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-3' : 'mt-0.5'}`}>
      <div className={`flex items-end gap-2 max-w-[85%] ${isOwn ? 'flex-row-reverse' : ''}`}>
        {!isOwn && (
          <div className={`flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
            {message.sender?.avatar_url
              ? <img src={message.sender.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" loading="lazy" decoding="async" />
              : <div className="w-8 h-8 rounded-full bg-primary-20 flex items-center justify-center text-xs font-bold text-primary">{initial}</div>}
          </div>
        )}
        <div className={`${isOwn ? 'items-end' : 'items-start'} flex flex-col relative`}>
          {showName && !isOwn && (
            <span className="text-xs text-text-tertiary mb-1 ml-1 font-medium flex items-center gap-1.5">
              {sender}{senderRole && <RoleBadge role={senderRole} />}
            </span>
          )}
          {message.is_pinned && <span className="text-xs text-warning mb-1 ml-1 flex items-center gap-1"><span>📌</span> Épinglé</span>}
          {replyToMessage && <MessageReplyPreview originalMessage={replyToMessage} onClickScrollTo={onScrollToMessage ? () => onScrollToMessage(replyToMessage.id) : undefined} />}
          <div className="flex items-center gap-1">
            {isOwn && <div className="flex-shrink-0"><MessageActions {...actions} /></div>}
            <div className={`px-4 py-2.5 rounded-2xl transition-colors duration-150 ${isOwn ? 'bg-primary text-white rounded-br-lg hover:bg-primary-hover hover:shadow-glow-primary-sm' : 'bg-bg-surface text-text-primary rounded-bl-lg hover:bg-bg-hover hover:shadow-sm'}`}>
              <MessageContent content={content} isOwn={isOwn} messageId={message.id} onPollVote={onPollVote} />
            </div>
            {!isOwn && <div className="flex-shrink-0"><MessageActions {...actions} /></div>}
          </div>
          <span className="text-xs text-text-quaternary mt-1 mx-1 flex items-center gap-1">
            {formatTime(message.created_at)}
            {message.edited_at && <span className="text-text-tertiary italic">(modifie)</span>}
            {isOwn && (isSquadChat ? <MessageStatus readBy={message.read_by} currentUserId={currentUserId} /> : <MessageStatus readAt={message.read_at} currentUserId={currentUserId} />)}
          </span>
          {isSquadChat && <MessageReactions messageId={message.id} isOwnMessage={isOwn} />}
        </div>
      </div>
    </motion.div>
  )
})
