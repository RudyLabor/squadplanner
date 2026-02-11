"use client";

import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Sparkles,
  Calendar,
  Users,
  MessageCircle,
  Mic,
} from './icons'
import { TourOverlay } from './tour/TourOverlay'
import { TourTooltip } from './tour/TourTooltip'

const TOUR_VERSION = 'v1'
const TOUR_COMPLETED_KEY = `sq-tour-completed-${TOUR_VERSION}`

interface TourStepDef {
  target: string
  title: string
  description: string
  icon: React.ElementType
  position: 'top' | 'bottom' | 'left' | 'right'
}

const TOUR_STEPS: TourStepDef[] = [
  {
    target: '[data-tour="squads"]',
    title: 'Tes Squads',
    description: 'Retrouve toutes tes squads ici. Clique pour voir les membres, le chat et les sessions.',
    icon: Users,
    position: 'right',
  },
  {
    target: '[data-tour="sessions"]',
    title: 'Planifier une session',
    description: 'Propose un créneau de jeu et invite ta squad. Le système RSVP force tout le monde à répondre.',
    icon: Calendar,
    position: 'right',
  },
  {
    target: '[data-tour="messages"]',
    title: 'Chat & Messages',
    description: 'Chat squad en temps réel + messages directs. Avec réactions emoji, read receipts et recherche.',
    icon: MessageCircle,
    position: 'right',
  },
  {
    target: '[data-tour="party"]',
    title: 'Party vocale',
    description: 'Lance un salon vocal pour ta squad. Audio adaptatif, reconnexion auto et volume individuel.',
    icon: Mic,
    position: 'right',
  },
  {
    target: '[data-tour="ai-coach"]',
    title: 'Coach IA',
    description: 'Ton assistant perso : suggestions de créneaux, aide à la décision, rappels RSVP intelligents.',
    icon: Sparkles,
    position: 'top',
  },
]

function getTooltipPosition(rect: DOMRect, position: TourStepDef['position']) {
  const gap = 12
  const tooltipWidth = 300
  const tooltipHeight = 160

  switch (position) {
    case 'right':
      return { top: rect.top + rect.height / 2 - tooltipHeight / 2, left: rect.right + gap }
    case 'left':
      return { top: rect.top + rect.height / 2 - tooltipHeight / 2, left: rect.left - tooltipWidth - gap }
    case 'bottom':
      return { top: rect.bottom + gap, left: rect.left + rect.width / 2 - tooltipWidth / 2 }
    case 'top':
      return { top: rect.top - tooltipHeight - gap, left: rect.left + rect.width / 2 - tooltipWidth / 2 }
  }
}

export function TourGuide() {
  const [active, setActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const location = useLocation()

  useEffect(() => {
    if (location.pathname !== '/squads') return
    try {
      const completed = localStorage.getItem(TOUR_COMPLETED_KEY)
      if (completed === 'true' || completed === 'shown') return
    } catch { return }

    const timer = setTimeout(() => {
      // Double-check in case another tab completed the tour
      try {
        const completed = localStorage.getItem(TOUR_COMPLETED_KEY)
        if (completed === 'true' || completed === 'shown') return
      } catch { return }

      const firstTarget = document.querySelector(TOUR_STEPS[0].target)
      if (firstTarget) {
        try { localStorage.setItem(TOUR_COMPLETED_KEY, 'true') } catch {}
        setActive(true)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [location.pathname])

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true')
    setActive(false)
  }, [])

  const updatePosition = useCallback(() => {
    if (!active) return

    const step = TOUR_STEPS[currentStep]
    const target = document.querySelector(step.target)

    if (target) {
      const rect = target.getBoundingClientRect()
      setTargetRect(rect)

      const pos = getTooltipPosition(rect, step.position)
      const maxLeft = window.innerWidth - 320
      const maxTop = window.innerHeight - 200
      pos.left = Math.max(12, Math.min(pos.left, maxLeft))
      pos.top = Math.max(12, Math.min(pos.top, maxTop))

      setTooltipPos(pos)
    } else {
      if (currentStep < TOUR_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1)
      } else {
        completeTour()
      }
    }
  }, [active, currentStep, completeTour])

  useEffect(() => {
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [updatePosition])

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      completeTour()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  if (!active || !tooltipPos) return null

  const step = TOUR_STEPS[currentStep]

  return (
    <>
      <TourOverlay targetRect={targetRect} onSkip={completeTour} />
      <TourTooltip
        currentStep={currentStep}
        totalSteps={TOUR_STEPS.length}
        title={step.title}
        description={step.description}
        icon={step.icon}
        tooltipPos={tooltipPos}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={completeTour}
      />
    </>
  )
}
