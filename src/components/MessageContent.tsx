import { memo, useMemo } from 'react'

/**
 * MessageContent — Phase 3.1
 * Renders message text with:
 * - @mention highlighting (indigo, clickable)
 * - **bold**, *italic*, ~~strikethrough~~, `inline code`
 * - URL detection → clickable links
 */

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
  onMentionClick?: (username: string) => void
}

export const MessageContent = memo(function MessageContent({
  content,
  isOwn = false,
  onMentionClick,
}: MessageContentProps) {
  const tokens = useMemo(() => tokenize(content), [content])

  if (tokens.length === 0) {
    return <span>{content}</span>
  }

  return (
    <span className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
      {tokens.map((token, i) => {
        switch (token.type) {
          case 'text':
            return <span key={i}>{token.value}</span>

          case 'bold':
            return <strong key={i} className="font-semibold">{token.value}</strong>

          case 'italic':
            return <em key={i} className="italic">{token.value}</em>

          case 'strike':
            return <s key={i} className="line-through opacity-60">{token.value}</s>

          case 'code':
            return (
              <code
                key={i}
                className={`px-1.5 py-0.5 rounded text-[13px] font-mono ${
                  isOwn
                    ? 'bg-[rgba(255,255,255,0.2)] text-white'
                    : 'bg-[rgba(99,102,241,0.1)] text-[#a5b4fc]'
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
                    : 'text-[#818cf8] hover:text-[#a5b4fc]'
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
                    ? 'bg-[rgba(255,255,255,0.2)] text-white hover:bg-[rgba(255,255,255,0.3)]'
                    : 'bg-[rgba(99,102,241,0.15)] text-[#818cf8] hover:bg-[rgba(99,102,241,0.25)]'
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
