import { motion } from 'framer-motion'
import { type ReactNode, type KeyboardEvent } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
  onClick?: () => void
  'aria-label'?: string
}

export function Card({ children, className = '', hoverable = false, onClick, 'aria-label': ariaLabel }: CardProps) {
  const baseClasses = 'bg-[rgba(255,255,255,0.02)] border border-border-subtle rounded-xl transition-all'
  const hoverClasses = hoverable ? 'hover:bg-[rgba(255,255,255,0.04)] hover:border-border-hover cursor-pointer' : ''
  const isClickable = !!onClick

  // Handle keyboard interaction for clickable cards
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick?.()
    }
  }

  return (
    <motion.div
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={ariaLabel}
      whileHover={hoverable ? { y: -2, scale: 1.01 } : undefined}
      whileTap={hoverable ? { scale: 0.98 } : undefined}
    >
      {children}
    </motion.div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-5 py-4 border-b border-border-subtle ${className}`}>
      {children}
    </div>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`p-5 ${className}`}>
      {children}
    </div>
  )
}
