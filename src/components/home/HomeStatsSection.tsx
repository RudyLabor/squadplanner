import { memo } from 'react'
import { Users, Calendar, TrendingUp } from '../icons'
import { m } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AnimatedCounter, ContentTransition, SkeletonStatsRow } from '../ui'

interface StatsRowProps {
  squadsCount: number
  sessionsThisWeek: number
  reliabilityScore: number
}

function StatsRow({ squadsCount, sessionsThisWeek, reliabilityScore }: StatsRowProps) {
  const stats = [
    { value: squadsCount, label: 'Squads', icon: Users, color: 'var(--color-primary)', suffix: '', path: '/squads' },
    { value: sessionsThisWeek, label: 'Cette semaine', icon: Calendar, color: 'var(--color-warning)', suffix: '', path: '/sessions' },
    { value: reliabilityScore, label: 'Fiabilité', icon: TrendingUp, color: 'var(--color-success)', suffix: '%', path: '/profile' },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {stats.map((stat, index) => (
        <Link key={stat.label} to={stat.path}>
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{
              scale: 1.02,
              boxShadow: `0 0 20px ${stat.color}25`,
            }}
            whileTap={{ scale: 0.98 }}
            className="h-[60px] sm:h-[68px] px-2 sm:px-4 flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-border-hover shadow-sm hover:bg-surface-card-hover cursor-pointer transition-all duration-200"
            style={{
              background: `linear-gradient(to bottom right, ${stat.color}12, transparent)`,
              transition: 'all 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${stat.color}15` }}
            >
              <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg sm:text-xl font-bold text-text-primary tracking-tight leading-none">
                <AnimatedCounter end={stat.value} duration={1.2} suffix={stat.suffix} />
              </div>
              <div className="text-2xs sm:text-xs text-text-quaternary uppercase tracking-wider mt-0.5 truncate font-medium">
                {stat.label}
              </div>
            </div>
          </m.div>
        </Link>
      ))}
    </div>
  )
}

interface HomeStatsSectionProps {
  squadsCount: number
  sessionsThisWeek: number
  reliabilityScore: number
  squadsLoading: boolean
  sessionsLoading: boolean
  profile: { streak_days?: number; streak_last_date?: string | null } | null
}

export const HomeStatsSection = memo(function HomeStatsSection({
  squadsCount,
  sessionsThisWeek,
  reliabilityScore,
  squadsLoading,
  sessionsLoading,
}: HomeStatsSectionProps) {
  return (
    <section aria-label="Tableau de bord" className="mb-6">
      <h2 className="text-base font-semibold text-text-primary mb-3">
        Ton tableau de bord
      </h2>
      <ContentTransition
        isLoading={squadsLoading || sessionsLoading}
        skeleton={<SkeletonStatsRow />}
      >
        <StatsRow
          squadsCount={squadsCount}
          sessionsThisWeek={sessionsThisWeek}
          reliabilityScore={reliabilityScore}
        />
      </ContentTransition>
    </section>
  )
})
