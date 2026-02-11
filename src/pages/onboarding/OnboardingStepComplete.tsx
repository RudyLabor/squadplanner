import { useState } from 'react'
import { m } from 'framer-motion'
import {
  Check,
  ArrowRight,
  Users,
  Gamepad2,
  Copy,
} from '../../components/icons'
import { Button, Card } from '../../components/ui'

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
  createdSquadId, createdSquadName, createdSquadCode,
  squadGame, squadsLength, firstSquadName, onComplete
}: OnboardingStepCompleteProps) {
  const [codeCopied, setCodeCopied] = useState(false)

  return (
    <m.div
      key="complete"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="text-center"
    >
      {/* Confetti animation - reduced to 8 particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <m.div
            key={i}
            initial={{
              y: -20,
              x: (i - 4) * 60,
              opacity: 1,
              rotate: 0
            }}
            animate={{
              y: 500,
              opacity: 0,
              rotate: (i % 2 === 0 ? 1 : -1) * 180
            }}
            transition={{
              duration: 2 + (i % 3) * 0.5,
              delay: i * 0.08,
              ease: "easeOut"
            }}
            className="absolute top-0 left-1/2"
            style={{
              width: 8 + (i % 3) * 4,
              height: 8 + (i % 3) * 4,
              backgroundColor: ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-error)', 'var(--color-purple)'][i % 5],
              borderRadius: i % 2 === 0 ? '50%' : '2px'
            }}
          />
        ))}
      </div>

      <m.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-20 h-20 rounded-full bg-success flex items-center justify-center mx-auto mb-6"
      >
        <Check className="w-10 h-10 text-white" />
      </m.div>

      <h2 className="text-xl font-bold text-text-primary mb-2">
        {createdSquadName ? `${createdSquadName} est pr\u00eate !` : "C'est parti !"}
      </h2>
      <p className="text-text-secondary mb-6">
        {createdSquadId
          ? "Invite tes potes et propose une premi\u00e8re session"
          : squadsLength > 0
            ? `Tu as rejoint ${firstSquadName} !`
            : "Tu peux maintenant explorer ou cr\u00e9er ta squad"
        }
      </p>

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
                    <p className="text-md font-semibold text-text-primary">{squadGame || 'Non d\u00e9fini'}</p>
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
                    aria-label={codeCopied ? 'Code copi\u00e9' : "Copier le code d'invitation"}
                  >
                    {codeCopied ? (
                      <Check className="w-5 h-5 text-success" aria-hidden="true" />
                    ) : (
                      <Copy className="w-5 h-5 text-primary" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-text-tertiary mt-2">
                  Partage ce code &agrave; tes amis pour qu'ils rejoignent
                </p>
              </div>
            </div>
          </Card>
        </m.div>
      )}

      <Button onClick={onComplete} className="w-full h-14 text-lg">
        {createdSquadId || squadsLength > 0 ? "Voir ma squad" : "Explorer"}
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </m.div>
  )
}
