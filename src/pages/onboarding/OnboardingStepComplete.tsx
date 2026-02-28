import { useState, useEffect } from 'react'
import { m } from 'framer-motion'
import { Check, ArrowRight, Users, Gamepad2, Copy, Gift, Sparkles, Calendar, Zap } from '../../components/icons'
import { Button, Card } from '../../components/ui'
import { useReferralStore } from '../../hooks/useReferral'

interface OnboardingStepCompleteProps {
  createdSquadId: string | null
  createdSquadName: string | null
  createdSquadCode: string | null
  squadGame: string
  squadsLength: number
  firstSquadName: string | undefined
  onComplete: () => void
}

export function OnboardingStepComplete({
  createdSquadId,
  createdSquadName,
  createdSquadCode,
  squadGame,
  squadsLength,
  firstSquadName,
  onComplete,
}: OnboardingStepCompleteProps) {
  const [codeCopied, setCodeCopied] = useState(false)
  const [refCopied, setRefCopied] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const { stats, fetchReferralStats, generateShareUrl } = useReferralStore()

  useEffect(() => {
    fetchReferralStats()
  }, [fetchReferralStats])

  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 800)
    return () => clearTimeout(timer)
  }, [])

  const referralUrl = stats?.referralCode ? generateShareUrl() : null

  return (
    <m.div
      key="complete"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="text-center"
    >
      {/* Confetti animation - 12 particles for bigger celebration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <m.div
            key={i}
            initial={{
              y: -20,
              x: (i - 6) * 50,
              opacity: 1,
              rotate: 0,
              scale: 0,
            }}
            animate={{
              y: 600,
              opacity: 0,
              rotate: (i % 2 === 0 ? 1 : -1) * 360,
              scale: 1,
            }}
            transition={{
              duration: 2.5 + (i % 3) * 0.5,
              delay: i * 0.06,
              ease: 'easeOut',
            }}
            className="absolute top-0 left-1/2"
            style={{
              width: 8 + (i % 3) * 4,
              height: 8 + (i % 3) * 4,
              backgroundColor: [
                'var(--color-primary)',
                'var(--color-success)',
                'var(--color-warning)',
                'var(--color-error)',
                'var(--color-purple)',
              ][i % 5],
              borderRadius: i % 2 === 0 ? '50%' : '2px',
            }}
          />
        ))}
      </div>

      {/* Animated success icon with glow */}
      <m.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-success to-success/70 flex items-center justify-center mx-auto mb-6 shadow-glow-success relative"
      >
        <Check className="w-12 h-12 text-white" />
        <m.div
          className="absolute -top-1 -right-1"
          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        >
          <Sparkles className="w-6 h-6 text-warning" />
        </m.div>
      </m.div>

      <m.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-extrabold text-text-primary mb-2"
      >
        {createdSquadName ? `${createdSquadName} est prÃªte Ã  jouer !` : "C'est parti !"}
      </m.h2>
      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-text-secondary mb-4"
      >
        {createdSquadId
          ? 'Ta squad est créée. Invite tes potes et planifie ta premiÃ¨re session !'
          : squadsLength > 0
            ? `Tu as rejoint ${firstSquadName} ! L'aventure commence.`
            : 'Tu peux maintenant explorer ou créer ta squad'}
      </m.p>

      {/* Quick stats - what you just unlocked */}
      {showStats && (
        <m.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center gap-4 mb-6"
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/15">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">Sessions illimitées</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/15">
            <Zap className="w-4 h-4 text-success" />
            <span className="text-xs font-medium text-success">Confirmations en 1 clic</span>
          </div>
        </m.div>
      )}

      {/* Squad recap card */}
      {createdSquadCode && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card className="p-5 text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-text-tertiary">Squad</p>
                  <p className="text-md font-semibold text-text-primary">{createdSquadName}</p>
                </div>
              </div>

              {squadGame && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success-10 flex items-center justify-center">
                    <Gamepad2 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-text-tertiary">Jeu</p>
                    <p className="text-md font-semibold text-text-primary">
                      {squadGame || 'Non défini'}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-border-default">
                <p className="text-sm text-text-tertiary mb-2">Code d'invitation</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-3 rounded-lg bg-surface-card border border-border-default text-lg font-mono font-bold text-text-primary tracking-widest text-center">
                    {createdSquadCode}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdSquadCode)
                      setCodeCopied(true)
                      setTimeout(() => setCodeCopied(false), 2000)
                    }}
                    className={`p-3 rounded-lg hover:scale-[1.02] transition-interactive ${codeCopied ? 'bg-success-10' : 'bg-primary-10 hover:bg-primary-15'}`}
                    aria-label={codeCopied ? 'Code copié' : "Copier le code d'invitation"}
                  >
                    {codeCopied ? (
                      <Check className="w-5 h-5 text-success" aria-hidden="true" />
                    ) : (
                      <Copy className="w-5 h-5 text-primary" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-text-tertiary mt-2">
                  Partage ce code avec tes amis pour qu'ils rejoignent
                </p>
              </div>
            </div>
          </Card>
        </m.div>
      )}

      {/* Referral invite section */}
      {referralUrl && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <Card className="p-5 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-md font-semibold text-text-primary">Invite tes amis</p>
                <p className="text-sm text-text-tertiary">Gagne 7 jours Premium par filleul</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2.5 rounded-lg bg-surface-card border border-border-default text-sm text-text-secondary truncate">
                {referralUrl}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralUrl)
                  setRefCopied(true)
                  setTimeout(() => setRefCopied(false), 2000)
                }}
                className={`p-2.5 rounded-lg transition-interactive ${refCopied ? 'bg-success-10' : 'bg-primary-10 hover:bg-primary-15'}`}
                aria-label={refCopied ? 'Lien copié' : 'Copier le lien de parrainage'}
              >
                {refCopied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-primary" />
                )}
              </button>
            </div>
          </Card>
        </m.div>
      )}

      <Button onClick={onComplete} className="w-full h-14 text-lg">
        {createdSquadId || squadsLength > 0 ? 'Voir ma squad' : 'Explorer'}
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </m.div>
  )
}
