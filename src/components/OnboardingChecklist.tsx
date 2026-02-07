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

export function OnboardingChecklist({
  hasSquad,
  hasSession,
  onCreateSession,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  // If all steps are complete, auto-hide after a celebration
  const allComplete = hasSquad && hasSession

  useEffect(() => {
    if (allComplete && !dismissed) {
      // Show celebration and auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        setDismissed(true)
        localStorage.setItem(STORAGE_KEY, 'true')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [allComplete, dismissed])

  // Don't show if dismissed or all complete
  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  const handleCopyInvite = async () => {
    const inviteUrl = window.location.origin
    await navigator.clipboard.writeText(inviteUrl)
    showSuccess('Lien d\'invitation copié ! 📋')
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
      done: false, // Always show as actionable
      icon: UserPlus,
      action: { type: 'button' as const, onClick: handleCopyInvite },
    },
    {
      id: 'session',
      label: 'Planifier ta première session',
      done: hasSession,
      icon: Calendar,
      action: hasSession ? undefined : { type: 'button' as const, onClick: onCreateSession },
    },
  ]

  const completedCount = [hasSquad, hasSession].filter(Boolean).length
  const totalSteps = 2 // Only count squad and session as completion criteria
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
            ? 'bg-gradient-to-r from-[#34d399]/10 to-transparent border-[#34d399]/20'
            : 'bg-gradient-to-r from-[#6366f1]/8 to-transparent border-[#6366f1]/15'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {allComplete ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-[#34d399]/15 flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-[#34d399]" />
                </motion.div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#6366f1]/15 flex items-center justify-center">
                  <span className="text-[12px] font-bold text-[#6366f1]">{completedCount}/{totalSteps}</span>
                </div>
              )}
              <h3 className="text-[14px] font-semibold text-[#f7f8f8]">
                {allComplete ? 'Bien joué ! Tu es prêt' : 'Pour bien démarrer'}
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Fermer l'onboarding"
            >
              <X className="w-4 h-4 text-[#5e6063]" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/5 rounded-full mb-4 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${allComplete ? 'bg-[#34d399]' : 'bg-[#6366f1]'}`}
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
                    step.done ? 'bg-white/[0.02]' : 'bg-white/[0.04]'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    step.done
                      ? 'bg-[#34d399]/15'
                      : 'bg-[#6366f1]/15'
                  }`}>
                    {step.done ? (
                      <Check className="w-4 h-4 text-[#34d399]" />
                    ) : (
                      <step.icon className="w-4 h-4 text-[#6366f1]" />
                    )}
                  </div>
                  <span className={`text-[13px] flex-1 ${
                    step.done
                      ? 'text-[#34d399] line-through'
                      : 'text-[#f7f8f8]'
                  }`}>
                    {step.label}
                  </span>
                  {!step.done && step.action && (
                    step.action.type === 'link' ? (
                      <Link
                        to={step.action.to}
                        className="flex items-center gap-1 text-[12px] text-[#6366f1] font-medium hover:text-[#8b93ff] transition-colors"
                      >
                        Faire
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <button
                        onClick={step.action.onClick}
                        className="flex items-center gap-1 text-[12px] text-[#6366f1] font-medium hover:text-[#8b93ff] transition-colors"
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
              className="text-[13px] text-[#34d399] text-center"
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
