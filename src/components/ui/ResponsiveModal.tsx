"use client";

import { type ReactNode, useState, useEffect } from 'react'
import { Dialog } from './Dialog'
import { Sheet } from './Sheet'

interface ResponsiveModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function ResponsiveModal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
}: ResponsiveModalProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (isMobile) {
    return (
      <Sheet open={open} onClose={onClose} title={title} description={description} side="bottom" snapPoints={[70, 95]}>
        {children}
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} title={title} description={description} size={size}>
      {children}
    </Dialog>
  )
}
