/**
 * Phase 4.2.2 — Status/Availability Selector
 * Dropdown on avatar to select online/busy/dnd/invisible
 */
import { useState, useRef, useEffect, memo } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import {
  Circle,
  Minus,
  BellOff,
  Eye,
  Gamepad2,
} from './icons'
import { useUserStatusStore, AVAILABILITY_CONFIG, type AvailabilityStatus } from '../hooks/useUserStatus'

const STATUS_OPTIONS: { value: AvailabilityStatus; icon: React.ElementType }[] = [
  { value: 'online', icon: Circle },
  { value: 'busy', icon: Minus },
  { value: 'dnd', icon: BellOff },
  { value: 'invisible', icon: Eye },
]

interface StatusSelectorProps {
  onOpenCustomStatus?: () => void
  className?: string
}

export const StatusSelector = memo(function StatusSelector({ onOpenCustomStatus, className = '' }: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { availability, setAvailability, customStatus, gameStatus } = useUserStatusStore()

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen])

  const currentConfig = AVAILABILITY_CONFIG[availability]

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* Trigger - small status dot */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-border-subtle transition-colors text-left w-full"
        aria-label={`Statut: ${currentConfig.label}`}
        aria-expanded={isOpen}
      >
        <span className={`w-2.5 h-2.5 rounded-full ${currentConfig.dotClass} flex-shrink-0`} />
        <span className="text-sm text-text-tertiary truncate">
          {customStatus ? `${customStatus.emoji} ${customStatus.text}` : currentConfig.label}
        </span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-1 w-56 bg-surface-dark border border-border-hover rounded-xl shadow-xl shadow-black/30 overflow-hidden z-50"
          >
            {/* Custom status section */}
            {customStatus && (
              <div className="px-3 py-2 border-b border-border-default">
                <div className="flex items-center gap-2 text-base">
                  <span>{customStatus.emoji}</span>
                  <span className="text-text-secondary truncate">{customStatus.text}</span>
                </div>
              </div>
            )}

            {/* Game status */}
            {gameStatus && (
              <div className="px-3 py-2 border-b border-border-default">
                <div className="flex items-center gap-2 text-base">
                  <Gamepad2 className="w-3.5 h-3.5 text-success" />
                  <span className="text-success truncate">{gameStatus.game}</span>
                </div>
              </div>
            )}

            {/* Status options */}
            <div className="py-1">
              {STATUS_OPTIONS.map(({ value, icon: Icon }) => {
                const config = AVAILABILITY_CONFIG[value]
                const isActive = availability === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setAvailability(value)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                      isActive
                        ? 'bg-primary-10 text-text-primary'
                        : 'text-text-secondary hover:bg-border-subtle hover:text-text-primary'
                    }`}
                  >
                    <Icon className="w-4 h-4" style={{ color: config.color }} strokeWidth={2} />
                    <span className="text-base font-medium">{config.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Custom status button */}
            {onOpenCustomStatus && (
              <div className="border-t border-border-default py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    onOpenCustomStatus()
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-text-secondary hover:bg-border-subtle hover:text-text-primary transition-colors"
                >
                  <span className="text-sm">😊</span>
                  <span className="text-base font-medium">
                    {customStatus ? 'Modifier le statut' : 'Définir un statut'}
                  </span>
                </button>
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
})
