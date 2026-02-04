import { motion } from 'framer-motion'
import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
  onClick?: () => void
}

export function Card({ children, className = '', hoverable = false, onClick }: CardProps) {
  const baseClasses = 'bg-[rgba(255,255,255,0.02)] border border-border-subtle rounded-xl transition-all'
  const hoverClasses = hoverable ? 'hover:bg-[rgba(255,255,255,0.04)] hover:border-border-hover cursor-pointer' : ''

  return (
    <motion.div
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
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
