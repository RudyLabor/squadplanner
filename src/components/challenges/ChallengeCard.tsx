import { motion } from 'framer-motion'
import { Zap, Check, Target, Gift, Star, Calendar, Trophy, Flame, Clock, Award, Sparkles } from 'lucide-react'
import { Button, Card } from '../ui'
import type { Challenge, UserChallenge } from '../Challenges'

// Icon mapping for challenge icons
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  star: Star, zap: Zap, calendar: Calendar, trophy: Trophy, target: Target,
  flame: Flame, gift: Gift, clock: Clock, award: Award, sparkles: Sparkles,
}

// Type metadata for styling and labels
const TYPE_CONFIG = {
  daily: { label: 'Quotidien', color: 'var(--color-success)', bgColor: 'var(--color-success-15)', borderColor: 'var(--color-success-30)', glowShadow: 'var(--shadow-glow-success)' },
  weekly: { label: 'Hebdomadaire', color: 'var(--color-primary)', bgColor: 'var(--color-primary-15)', borderColor: 'var(--color-primary-30)', glowShadow: 'var(--shadow-glow-primary-md)' },
  seasonal: { label: 'Saisonnier', color: 'var(--color-warning)', bgColor: 'var(--color-warning-15)', borderColor: 'var(--color-warning-30)', glowShadow: 'var(--shadow-glow-warning)' },
  achievement: { label: 'Accomplissement', color: 'var(--color-primary)', bgColor: 'var(--color-primary-15)', borderColor: 'var(--color-primary-30)', glowShadow: 'var(--shadow-glow-primary-md)' },
}

interface ChallengeCardProps {
  challenge: Challenge & { userProgress?: UserChallenge }
  index: number
  onClaim: (id: string) => void
  isClaiming: boolean
}

export function ChallengeCard({ challenge, index, onClaim, isClaiming }: ChallengeCardProps) {
  const config = TYPE_CONFIG[challenge.type]
  const IconComponent = ICON_MAP[challenge.icon.toLowerCase()] || Target

  const progress = challenge.userProgress?.progress ?? 0
  const target = challenge.userProgress?.target ?? 1
  const progressPercent = Math.min((progress / target) * 100, 100)
  const isCompleted = !!challenge.userProgress?.completed_at
  const isClaimed = !!challenge.userProgress?.xp_claimed
  const canClaim = isCompleted && !isClaimed

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.05 }}>
      <Card className={`p-4 transition-interactive ${isClaimed ? 'bg-surface-card opacity-60' : canClaim ? 'bg-surface-dark border-success shadow-glow-success' : 'bg-surface-dark border-border-hover'}`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative" style={{ backgroundColor: config.bgColor }}>
            {isClaimed ? <Check className="w-6 h-6" style={{ color: config.color }} /> : <IconComponent className="w-6 h-6" style={{ color: config.color }} />}
            {canClaim && (
              <motion.div className="absolute inset-0 rounded-xl" style={{ boxShadow: config.glowShadow }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className={`text-md font-semibold ${isClaimed ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>{challenge.title}</h3>
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-full uppercase" style={{ backgroundColor: config.bgColor, color: config.color }}>{config.label}</span>
                </div>
                <p className={`text-sm ${isClaimed ? 'text-text-tertiary' : 'text-text-secondary'}`}>{challenge.description}</p>
              </div>

              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0 ${isClaimed ? 'bg-surface-card' : 'bg-warning-15'}`}>
                <Zap className={`w-3.5 h-3.5 ${isClaimed ? 'text-text-tertiary' : 'text-warning'}`} />
                <span className={`text-sm font-bold ${isClaimed ? 'text-text-tertiary' : 'text-warning'}`}>{challenge.xp_reward} XP</span>
              </div>
            </div>

            {!isClaimed && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-text-secondary">Progression</span>
                  <span className="text-text-tertiary">{progress}/{target}</span>
                </div>
                <div className="relative h-2 bg-border-subtle rounded-full overflow-hidden">
                  <motion.div
                    className="absolute h-full rounded-full"
                    style={{ background: isCompleted ? `linear-gradient(90deg, ${config.color}, var(--color-success))` : config.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                  />
                  {isCompleted && (
                    <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }} />
                  )}
                </div>
              </div>
            )}

            {canClaim && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                <Button size="sm" onClick={() => onClaim(challenge.id)} isLoading={isClaiming} className="w-full bg-gradient-to-r from-success to-success-dark hover:from-success-dark hover:to-success-darker text-bg-base">
                  <Gift className="w-4 h-4" />
                  Reclamer {challenge.xp_reward} XP
                </Button>
              </motion.div>
            )}

            {isClaimed && (
              <div className="mt-3 flex items-center gap-2 text-sm text-text-tertiary">
                <Check className="w-4 h-4 text-success" />
                <span>XP réclamés</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
