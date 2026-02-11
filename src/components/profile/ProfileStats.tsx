import { m } from 'framer-motion'
import {
  Calendar,
  Check,
  Target,
  Trophy,
  Sparkles,
  TrendingUp,
  Plus,
} from '../icons'
import { Link } from 'react-router'
import { Card, ProgressRing, AnimatedCounter, HelpTooltip } from '../ui'

// Système de tiers basé sur le score de fiabilité
const TIERS = [
  { name: 'Débutant', color: 'var(--color-text-secondary)', bgColor: 'var(--color-overlay-light)', icon: '', minScore: 0, glow: false },
  { name: 'Confirmé', color: 'var(--color-primary)', bgColor: 'var(--color-primary-15)', icon: '', minScore: 50, glow: false },
  { name: 'Expert', color: 'var(--color-success)', bgColor: 'var(--color-success-15)', icon: '', minScore: 70, glow: false },
  { name: 'Master', color: 'var(--color-purple)', bgColor: 'var(--color-purple-15)', icon: '', minScore: 85, glow: true },
  { name: 'Légende', color: 'var(--color-warning)', bgColor: 'var(--color-warning-15)', icon: '', minScore: 95, glow: true },
]

const getTier = (score: number) => {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (score >= TIERS[i].minScore) return { ...TIERS[i], nextTier: TIERS[i + 1] || null }
  }
  return { ...TIERS[0], nextTier: TIERS[1] }
}

interface ProfileStatsProps {
  profile: {
    reliability_score?: number
    total_sessions?: number
    total_checkins?: number
    level?: number
    xp?: number
  } | null
  profileReady: boolean
}

export function ProfileStats({ profile, profileReady }: ProfileStatsProps) {
  const reliabilityScore = profile?.reliability_score ?? 100
  const tier = getTier(reliabilityScore)
  const reliabilityColor = tier.color

  const totalSessions = profile?.total_sessions || 0
  const totalCheckins = profile?.total_checkins || 0
  const hasNoActivity = totalSessions === 0 && totalCheckins === 0

  const stats = [
    { icon: Calendar, label: 'Sessions', value: totalSessions, color: 'var(--color-warning)', bgColor: 'var(--color-warning-15)' },
    { icon: Check, label: 'Check-ins', value: totalCheckins, color: 'var(--color-success)', bgColor: 'var(--color-success-15)' },
    { icon: Target, label: 'Niveau', value: profile?.level ?? 1, color: 'var(--color-primary)', bgColor: 'var(--color-primary-15)' },
    { icon: Trophy, label: 'XP', value: profile?.xp ?? 0, color: 'var(--color-purple)', bgColor: 'var(--color-purple-15)' },
  ]

  return (
    <>
      {/* Score de fiabilité - Card principale avec Tier System */}
      {!profileReady ? (
        <Card className="mb-5 overflow-hidden bg-bg-elevated">
          <div className="h-1.5 bg-surface-card" />
          <div className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-surface-card animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-8 w-24 rounded bg-surface-card animate-pulse" />
                <div className="h-4 w-32 rounded bg-surface-card animate-pulse" />
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className={`mb-5 overflow-hidden bg-bg-elevated ${tier.glow ? 'ring-1 ring-warning/30 ring-offset-1 ring-offset-bg-base' : ''}`}>
          <div
            className="h-1.5"
            style={{
              background: `linear-gradient(to right, ${reliabilityColor} ${reliabilityScore}%, var(--color-overlay-light) ${reliabilityScore}%)`
            }}
          />
          <div className="p-5">
            <div className="flex items-center gap-4">
              <ProgressRing
                value={reliabilityScore}
                size={64}
                strokeWidth={5}
                color={reliabilityColor}
                showValue={false}
              />
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-3xl font-bold text-text-primary">
                    <AnimatedCounter end={reliabilityScore} duration={1.5} suffix="%" />
                  </span>
                  <m.span
                    className="text-base font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5"
                    style={{ backgroundColor: tier.bgColor, color: reliabilityColor }}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <span>{tier.icon}</span>
                    <span>{tier.name}</span>
                  </m.span>
                </div>
                <HelpTooltip content="Ton score de fiabilité mesure ta régularité aux sessions. Plus tu confirmes et te présentes, plus il monte." position="bottom">
                  <p className="text-base text-text-quaternary">Score de fiabilité</p>
                </HelpTooltip>

                {tier.nextTier && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-text-tertiary">
                        Prochain : <span style={{ color: tier.nextTier.color }}>{tier.nextTier.icon} {tier.nextTier.name}</span>
                      </span>
                      <span className="text-text-quaternary">
                        {tier.nextTier.minScore - reliabilityScore}% restants
                      </span>
                    </div>
                    <div className="relative h-2 bg-surface-card rounded-full overflow-hidden">
                      <m.div
                        className="absolute h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${reliabilityColor}, ${tier.nextTier.color})`
                        }}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${((reliabilityScore - tier.minScore) / (tier.nextTier.minScore - tier.minScore)) * 100}%`
                        }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                {!tier.nextTier && (
                  <m.p
                    className="text-sm mt-2 flex items-center gap-1"
                    style={{ color: tier.color }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: 3 }}
                  >
                    <Sparkles className="w-3 h-3" />
                    Tu as atteint le rang maximum !
                  </m.p>
                )}
              </div>
              {tier.glow && (
                <m.div
                  animate={{ rotate: [0, 12, -12, 0] }}
                  transition={{ duration: 2, repeat: 3 }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: reliabilityColor }} />
                </m.div>
              )}
              {!tier.glow && <TrendingUp className="w-5 h-5 text-success" />}
            </div>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      {!profileReady ? (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5" aria-label="Statistiques">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-4 bg-bg-elevated">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-card animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-5 w-10 rounded bg-surface-card animate-pulse" />
                  <div className="h-3 w-14 rounded bg-surface-card animate-pulse" />
                </div>
              </div>
            </Card>
          ))}
        </section>
      ) : (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5" aria-label="Statistiques">
            {stats.map(stat => (
              <Card key={stat.label} className="p-4 bg-bg-elevated">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: stat.bgColor }}
                  >
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text-primary">
                      <AnimatedCounter end={stat.value} duration={1.5} />
                    </div>
                    <div className="text-sm text-text-quaternary">{stat.label}</div>
                  </div>
                </div>
              </Card>
            ))}
          </section>
          {hasNoActivity && (
            <Card className="mb-5 p-4 bg-gradient-to-br from-primary/5 to-transparent border-dashed text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-md font-medium text-text-primary">Planifie ta première session !</p>
                  <Link to="/squads" className="text-base text-primary hover:text-primary-hover font-medium transition-colors">
                    Créer une session
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </>
  )
}
