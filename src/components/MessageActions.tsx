import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Pin,
  Reply,
  Copy,
  Check,
  Forward
} from 'lucide-react'

export interface MessageActionsProps {
  message: {
    id: string
    sender_id: string
    content: string
  }
  currentUserId: string
  isAdmin: boolean
  onEdit: () => void
  onDelete: () => void
  onPin: () => void
  onReply: () => void
  onForward?: () => void
}

/**
 * MessageActions component
 * Provides a dropdown menu for message actions:
 * - Edit (own messages only)
 * - Delete (own messages only)
 * - Pin (admins only)
 * - Reply
 * - Copy text
 */
export function MessageActions({
  message,
  currentUserId,
  isAdmin,
  onEdit,
  onDelete,
  onPin,
  onReply,
  onForward
}: MessageActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isOwnMessage = message.sender_id === currentUserId

  // Close menu on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
        setShowDeleteConfirm(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setShowDeleteConfirm(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Long press handling for mobile
  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setIsOpen(true)
    }, 500) // 500ms long press
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setIsOpen(false)
      }, 1000)
    } catch {
      console.error('Failed to copy text')
    }
  }

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete()
      setIsOpen(false)
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
    }
  }

  const handleEdit = () => {
    onEdit()
    setIsOpen(false)
  }

  const handlePin = () => {
    onPin()
    setIsOpen(false)
  }

  const handleReply = () => {
    onReply()
    setIsOpen(false)
  }

  const handleForward = () => {
    onForward?.()
    setIsOpen(false)
  }

  return (
    <div
      className="relative inline-flex"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Trigger button - visible on hover (desktop) */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-border-hover transition-interactive focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Actions du message"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <MoreHorizontal className="w-4 h-4 text-text-secondary" />
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.9, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, duration: 0.15 }}
            className="absolute right-0 top-full mt-1 z-50 min-w-[180px] py-1.5 bg-surface-dark border border-border-hover rounded-xl shadow-xl shadow-black/40"
            role="menu"
            aria-orientation="vertical"
          >
            {/* Reply */}
            <button
              onClick={handleReply}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] text-text-primary hover:bg-border-default transition-colors"
              role="menuitem"
            >
              <Reply className="w-4 h-4 text-text-secondary" />
              <span>Repondre</span>
            </button>

            {/* Copy */}
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] text-text-primary hover:bg-border-default transition-colors"
              role="menuitem"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#4ade80]" />
                  <span className="text-[#4ade80]">Copie !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-text-secondary" />
                  <span>Copier le texte</span>
                </>
              )}
            </button>

            {/* Forward */}
            {onForward && (
              <button
                onClick={handleForward}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] text-text-primary hover:bg-border-default transition-colors"
                role="menuitem"
              >
                <Forward className="w-4 h-4 text-text-secondary" />
                <span>Transferer</span>
              </button>
            )}

            {/* Pin (admins only) */}
            {isAdmin && (
              <button
                onClick={handlePin}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] text-text-primary hover:bg-border-default transition-colors"
                role="menuitem"
              >
                <Pin className="w-4 h-4 text-[#f5a623]" />
                <span>Epingler</span>
              </button>
            )}

            {/* Edit (own messages only) */}
            {isOwnMessage && (
              <>
                <div className="my-1.5 h-px bg-border-default" role="separator" />
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] text-text-primary hover:bg-border-default transition-colors"
                  role="menuitem"
                >
                  <Pencil className="w-4 h-4 text-[#5e6dd2]" />
                  <span>Modifier</span>
                </button>
              </>
            )}

            {/* Delete (own messages only) */}
            {isOwnMessage && (
              <button
                onClick={handleDelete}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] transition-colors ${
                  showDeleteConfirm
                    ? 'bg-error/15 text-error'
                    : 'text-error hover:bg-error/10'
                }`}
                role="menuitem"
              >
                <Trash2 className="w-4 h-4" />
                <span>{showDeleteConfirm ? 'Confirmer la suppression' : 'Supprimer'}</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MessageActions
