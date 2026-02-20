
import { memo, useMemo } from 'react'
import { isLocationMessage, parseLocationMessage, LocationMessage } from './LocationShare'
import { isPollMessage, parsePollData, ChatPoll } from './ChatPoll'

/**
 * MessageContent — Phase 3.1 + Phase 4
 * Renders message text with:
 * - @mention highlighting (indigo, clickable)
 * - **bold**, *italic*, ~~strikethrough~~, `inline code`
 * - URL detection → clickable links
 * - GIF/image URLs → inline images
 * - [Phase 4] Location messages, Polls, Forwarded messages
 */

// GIF URL pattern — detect full-message GIPHY/Tenor image URLs
const GIF_URL_REGEX = /^https?:\/\/media[0-9]?\.giphy\.com\/media\/.+\.(gif|webp|mp4)/i
const IMAGE_URL_REGEX = /^https?:\/\/\S+\.(gif|webp|png|jpg|jpeg)(\?[^\s]*)?$/i

function isGifUrl(content: string): boolean {
  const trimmed = content.trim()
  return GIF_URL_REGEX.test(trimmed) || (IMAGE_URL_REGEX.test(trimmed) && trimmed.includes('giphy.com'))
}

// URL regex
const URL_REGEX = /https?:\/\/[^\s<]+[^<.,:;"')\]\s]/g

// Markdown-like patterns (non-greedy, single-line)
const BOLD_REGEX = /\*\*(.+?)\*\*/g
const ITALIC_REGEX = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g
const STRIKE_REGEX = /~~(.+?)~~/g
const CODE_REGEX = /`([^`]+)`/g

// @mention regex: matches @username (alphanumeric + underscore + dots)
const MENTION_REGEX = /@([\w.]+)/g

type Token =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'strike'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; value: string }
  | { type: 'mention'; value: string }

function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  // Combine all patterns into one regex for ordered matching
  const combined = new RegExp(
    `(${URL_REGEX.source})|(${CODE_REGEX.source})|(${BOLD_REGEX.source})|(${ITALIC_REGEX.source})|(${STRIKE_REGEX.source})|(${MENTION_REGEX.source})`,
    'g'
  )

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = combined.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }

    if (match[1]) {
      // URL
      tokens.push({ type: 'link', value: match[1] })
    } else if (match[2]) {
      // `code` — match[3] is the inner content
      tokens.push({ type: 'code', value: match[3] })
    } else if (match[4]) {
      // **bold** — match[5] is the inner content
      tokens.push({ type: 'bold', value: match[5] })
    } else if (match[6]) {
      // *italic* — match[7] is the inner content
      tokens.push({ type: 'italic', value: match[7] })
    } else if (match[8]) {
      // ~~strike~~ — match[9] is the inner content
      tokens.push({ type: 'strike', value: match[9] })
    } else if (match[10]) {
      // @mention — match[11] is the username
      tokens.push({ type: 'mention', value: match[11] })
    }

    lastIndex = combined.lastIndex
  }

  // Remaining text
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return tokens
}

interface MessageContentProps {
  content: string
  isOwn?: boolean
  messageId?: string
  onMentionClick?: (username: string) => void
  onPollVote?: (messageId: string, optionIndex: number) => void
}

export const MessageContent = memo(function MessageContent({
  content,
  isOwn = false,
  messageId,
  onMentionClick,
  onPollVote,
}: MessageContentProps) {
  // Phase 4: Special message types
  // Location message
  if (isLocationMessage(content)) {
    const coords = parseLocationMessage(content)
    if (coords) {
      return <LocationMessage lat={coords.lat} lng={coords.lng} isOwn={isOwn} />
    }
  }

  // Poll message
  if (isPollMessage(content)) {
    const pollData = parsePollData(content)
    if (pollData) {
      return (
        <ChatPoll
          pollData={pollData}
          messageId={messageId || ''}
          onVote={onPollVote}
          isOwn={isOwn}
        />
      )
    }
  }

  // GIF message — render as inline image
  if (isGifUrl(content)) {
    return (
      <img
        src={content.trim()}
        alt="GIF"
        className="max-w-[260px] max-h-[260px] w-auto h-auto rounded-lg object-contain"
        loading="lazy"
        decoding="async"
      />
    )
  }

  // Forwarded message indicator
  if (content.startsWith('↩️ *Transféré de ')) {
    const lines = content.split('\n')
    const header = lines[0]
    const body = lines.slice(1).join('\n')
    return (
      <div className="text-md leading-relaxed whitespace-pre-wrap break-words">
        <div
          className={`text-sm italic mb-1 flex items-center gap-1 ${isOwn ? 'text-white/60' : 'text-text-quaternary'}`}
        >
          ↩️ {header.replace('↩️ ', '').replace(/\*/g, '')}
        </div>
        <div className={`pl-3 border-l-2 ${isOwn ? 'border-overlay-heavy' : 'border-primary'}`}>
          <MessageContent content={body} isOwn={isOwn} onMentionClick={onMentionClick} />
        </div>
      </div>
    )
  }

  const tokens = useMemo(() => tokenize(content), [content])

  if (tokens.length === 0) {
    return <span>{content}</span>
  }

  return (
    <span className="text-md leading-relaxed whitespace-pre-wrap break-words">
      {tokens.map((token, i) => {
        switch (token.type) {
          case 'text':
            return <span key={i}>{token.value}</span>

          case 'bold':
            return (
              <strong key={i} className="font-semibold">
                {token.value}
              </strong>
            )

          case 'italic':
            return (
              <em key={i} className="italic">
                {token.value}
              </em>
            )

          case 'strike':
            return (
              <s key={i} className="line-through opacity-60">
                {token.value}
              </s>
            )

          case 'code':
            return (
              <code
                key={i}
                className={`px-1.5 py-0.5 rounded text-base font-mono ${
                  isOwn ? 'bg-overlay-heavy text-white' : 'bg-primary-10 text-primary-hover'
                }`}
              >
                {token.value}
              </code>
            )

          case 'link':
            return (
              <a
                key={i}
                href={token.value}
                target="_blank"
                rel="noopener noreferrer"
                className={`underline decoration-1 underline-offset-2 transition-colors ${
                  isOwn
                    ? 'text-white/90 hover:text-white'
                    : 'text-primary-hover hover:text-primary-hover'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {token.value.length > 50 ? token.value.slice(0, 47) + '...' : token.value}
              </a>
            )

          case 'mention':
            return (
              <button
                key={i}
                type="button"
                className={`inline rounded px-0.5 font-medium transition-colors ${
                  isOwn
                    ? 'bg-overlay-heavy text-white hover:bg-overlay-heavy'
                    : 'bg-primary-15 text-primary-hover hover:bg-primary-20'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  onMentionClick?.(token.value)
                }}
              >
                @{token.value}
              </button>
            )

          default:
            return null
        }
      })}
    </span>
  )
})

export default MessageContent
