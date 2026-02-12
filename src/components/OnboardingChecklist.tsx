"use client";

import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import {
  Users,
  UserPlus,
  Calendar,
  Check,
  X,
  ChevronRight,
  Sparkles,
  Star,
} from './icons'
import { Link } from 'react-router'
import { Card } from './ui'
import { showSuccess } from '../lib/toast'
import Confetti from './LazyConfetti'

interface OnboardingChecklistProps {
  hasSquad: boolean
  hasSession: boolean
  onCreateSession: () => void
}

const STORAGE_KEY = 'squadplanner-onboarding-dismissed'
const INVITE_COPIED_KEY = 'squadplanner-invite-copied'

export function OnboardingChecklist({
  hasSquad,
  hasSession,
  onCreateSession,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)
  const [lastCompletedStep, setLastCompletedStep] = useState<string | null>(null)
  const [showStepConfetti, setShowStepConfetti] = useState(false)

  // Hydrate from localStorage in useEffect to avoid SSR/client mismatch (React #418)
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') setDismissed(true)
    if (localStorage.getItem(INVITE_COPIED_KEY) === 'true') setInviteCopied(true)
  }, [])

  // Track step completion and trigger confetti
  useEffect(() => {
    if (hasSquad && lastCompletedStep !== 'squad') {
      setLastCompletedStep('squad')
      setShowStepConfetti(true)
      setTimeout(() => setShowStepConfetti(false), 2000)
    }
  }, [hasSquad, lastCompletedStep])

  useEffect(() => {
    if (inviteCopied && lastCompletedStep !== 'invite') {
      setLastCompletedStep('invite')
      setShowStepConfetti(true)
      setTimeout(() => setShowStepConfetti(false), 2000)
    }
  }, [inviteCopied, lastCompletedStep])

  useEffect(() => {
    if (hasSession && lastCompletedStep !== 'session') {
      setLastCompletedStep('session')
      setShowStepConfetti(true)
      setTimeout(() => setShowStepConfetti(false), 2000)
    }
  }, [hasSession, lastCompletedStep])

  // If all steps are complete, auto-hide after a celebration
  const allComplete = hasSquad && hasSession && inviteCopied

  useEffect(() => {
    if (allComplete && !dismissed) {
      const timer = setTimeout(() => {
        setDismissed(true)
        localStorage.setItem(STORAGE_KEY, 'true')
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [allComplete, dismissed])

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  const handleCopyInvite = async () => {
    const inviteUrl = `${window.location.origin}/auth`
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setInviteCopied(true)
      localStorage.setItem(INVITE_COPIED_KEY, 'true')
      showSuccess('Lien d\'invitation copié ! Partage-le à tes potes')
    } catch {
      // Fallback: select text in a temp input
      const input = document.createElement('input')
      input.value = inviteUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setInviteCopied(true)
      localStorage.setItem(INVITE_COPIED_KEY, 'true')
      showSuccess('Lien copié !')
    }
  }

  const steps = [
    {
      id: 'squad',
      label: 'Crée ou rejoins ta première squad',
      description: 'Une squad rassemble tes potes de jeu',
      done: hasSquad,
      icon: Users,
      action: hasSquad ? undefined : { type: 'link' as const, to: '/squads' },
    },
    {
      id: 'invite',
      label: 'Invite un ami',
      description: 'Plus on est de fous, plus on rit !',
      done: inviteCopied,
      icon: UserPlus,
      action: inviteCopied ? undefined : { type: 'button' as const, onClick: handleCopyInvite },
    },
    {
      id: 'session',
      label: 'Planifie ta première session',
      description: 'Organise une partie avec ta squad',
      done: hasSession,
      icon: Calendar,
      action: hasSession ? undefined : { type: 'button' as const, onClick: onCreateSession },
    },
  ]

  const completedCount = [hasSquad, inviteCopied, hasSession].filter(Boolean).length
  const totalSteps = 3
  const progress = (completedCount / totalSteps) * 100

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 relative"
      >
        {/* Confetti pour chaque étape complétée */}
        {showStepConfetti && typeof window !== 'undefined' && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={80}
            gravity={0.3}
            colors={['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)']}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
          />
        )}

        <Card className={`p-5 border-2 shadow-lg relative overflow-hidden ${
          allComplete
            ? 'bg-gradient-to-br from-success/15 via-success/8 to-bg-elevated border-success/30 shadow-glow-success'
            : 'bg-gradient-to-br from-primary/12 via-primary/6 to-bg-elevated border-primary/25 shadow-glow-primary-sm'
        }`}>
          {/* Animated background sparkles for complete state */}
          {allComplete && (
            <>
              <m.div
                className="absolute top-4 right-4 text-success"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              >
                <Star className="w-6 h-6 fill-success" />
              </m.div>
              <m.div
                className="absolute bottom-4 left-4 text-warning"
                animate={{
                  rotate: [0, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
              >
                <Sparkles className="w-5 h-5" />
              </m.div>
            </>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {allComplete ? (
                <m.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-success to-success/70 flex items-center justify-center shadow-glow-success"
                >
                  <Check className="w-6 h-6 text-white" />
                </m.div>
              ) : (
                <m.div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-glow-primary-sm"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-base font-bold text-white">{completedCount}/{totalSteps}</span>
                </m.div>
              )}
              <div>
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  {allComplete ? (
                    <>
                      Bravo, t'es prêt à rouler !
                      <m.span
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                      >
                        🎉
                      </m.span>
                    </>
                  ) : (
                    'Démarrage rapide'
                  )}
                </h3>
                {!allComplete && (
                  <p className="text-sm text-text-tertiary mt-0.5">
                    {completedCount === 0 ? 'Commençons l\'aventure ensemble' :
                     completedCount === 1 ? 'Super début ! Continue comme ça' :
                     'Plus qu\'une étape !'}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-overlay-subtle transition-colors flex-shrink-0"
              aria-label="Fermer l'onboarding"
            >
              <X className="w-4 h-4 text-text-tertiary" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-overlay-subtle rounded-full mb-4 overflow-hidden relative">
            <m.div
              className={`h-full rounded-full relative ${allComplete ? 'bg-gradient-to-r from-success to-success/70' : 'bg-gradient-to-r from-primary to-primary/70'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Animated shimmer effect */}
              <m.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              />
            </m.div>
          </div>

          {/* Steps */}
          {!allComplete && (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <m.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    step.done
                      ? 'bg-success/10 border-success/20'
                      : 'bg-surface-card border-border-subtle hover:border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  <m.div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      step.done
                        ? 'bg-gradient-to-br from-success to-success/70 shadow-glow-success'
                        : 'bg-gradient-to-br from-primary/20 to-primary/10'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {step.done ? (
                      <m.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      >
                        <Check className="w-5 h-5 text-white" />
                      </m.div>
                    ) : (
                      <step.icon className="w-5 h-5 text-primary" />
                    )}
                  </m.div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-base font-semibold ${
                      step.done
                        ? 'text-success'
                        : 'text-text-primary'
                    }`}>
                      {step.label}
                    </div>
                    <div className="text-sm text-text-tertiary">
                      {step.description}
                    </div>
                  </div>
                  {!step.done && step.action && (
                    step.action.type === 'link' ? (
                      <Link
                        to={step.action.to}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors shadow-sm hover:shadow-md flex-shrink-0"
                      >
                        Go
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <button
                        onClick={step.action.onClick}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors shadow-sm hover:shadow-md flex-shrink-0"
                      >
                        Go
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )
                  )}
                  {step.done && (
                    <m.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-sm font-medium text-success bg-success/15 px-3 py-1.5 rounded-full flex-shrink-0"
                    >
                      Fait ✓
                    </m.div>
                  )}
                </m.div>
              ))}
            </div>
          )}

          {/* Celebration message when complete */}
          {allComplete && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-3"
            >
              <p className="text-lg font-semibold text-success">
                Ton aventure Squad Planner commence maintenant !
              </p>
              <p className="text-base text-text-secondary">
                Ta squad t'attend. C'est parti pour la victoire ! 🚀
              </p>
            </m.div>
          )}
        </Card>
      </m.div>
    </AnimatePresence>
  )
}

export default OnboardingChecklist
