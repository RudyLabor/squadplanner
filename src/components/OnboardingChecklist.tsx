import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserPlus, Calendar, Check, X, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from './ui'
import { showSuccess } from '../lib/toast'

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
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })
  const [inviteCopied, setInviteCopied] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(INVITE_COPIED_KEY) === 'true'
  })

  // If all steps are complete, auto-hide after a celebration
  const allComplete = hasSquad && hasSession && inviteCopied

  useEffect(() => {
    if (allComplete && !dismissed) {
      const timer = setTimeout(() => {
        setDismissed(true)
        localStorage.setItem(STORAGE_KEY, 'true')
      }, 3000)
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
      label: 'Rejoindre ou créer une squad',
      done: hasSquad,
      icon: Users,
      action: hasSquad ? undefined : { type: 'link' as const, to: '/squads' },
    },
    {
      id: 'invite',
      label: 'Inviter un ami',
      done: inviteCopied,
      icon: UserPlus,
      action: inviteCopied ? undefined : { type: 'button' as const, onClick: handleCopyInvite },
    },
    {
      id: 'session',
      label: 'Planifier ta première session',
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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-6"
      >
        <Card className={`p-4 border ${
          allComplete
            ? 'bg-gradient-to-r from-success/10 to-bg-elevated border-success/20'
            : 'bg-gradient-to-r from-primary/8 to-bg-elevated border-primary/15'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {allComplete ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-success/15 flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-success" />
                </motion.div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{completedCount}/{totalSteps}</span>
                </div>
              )}
              <h3 className="text-md font-semibold text-text-primary">
                {allComplete ? 'Bien joué ! Tu es prêt' : 'Pour bien démarrer'}
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-overlay-subtle transition-colors"
              aria-label="Fermer l'onboarding"
            >
              <X className="w-4 h-4 text-text-tertiary" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-overlay-subtle rounded-full mb-4 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${allComplete ? 'bg-success' : 'bg-primary'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Steps */}
          {!allComplete && (
            <div className="space-y-2">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    step.done ? 'bg-overlay-faint' : 'bg-overlay-subtle'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    step.done
                      ? 'bg-success/15'
                      : 'bg-primary/15'
                  }`}>
                    {step.done ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <step.icon className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <span className={`text-base flex-1 ${
                    step.done
                      ? 'text-success line-through'
                      : 'text-text-primary'
                  }`}>
                    {step.label}
                  </span>
                  {!step.done && step.action && (
                    step.action.type === 'link' ? (
                      <Link
                        to={step.action.to}
                        className="flex items-center gap-1 text-sm text-primary font-medium hover:text-primary-hover transition-colors"
                      >
                        Faire
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <button
                        onClick={step.action.onClick}
                        className="flex items-center gap-1 text-sm text-primary font-medium hover:text-primary-hover transition-colors"
                      >
                        Faire
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Celebration message when complete */}
          {allComplete && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-base text-success text-center"
            >
              Ta squad t'attend. C'est parti !
            </motion.p>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

export default OnboardingChecklist
