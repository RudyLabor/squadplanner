"use client";

import { memo } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft } from '../icons'
interface MobilePageHeaderProps {
  title: string
  onBack?: () => void
}

export const MobilePageHeader = memo(function MobilePageHeader({ title, onBack }: MobilePageHeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="lg:hidden flex items-center gap-3 px-4 py-3">
      <button
        onClick={handleBack}
        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-bg-hover transition-colors touch-target"
        aria-label="Retour"
      >
        <ChevronLeft className="w-6 h-6 text-text-secondary" />
      </button>
      <h1 className="text-base font-semibold text-text-primary truncate">{title}</h1>
    </div>
  )
})
