import { memo } from 'react'
import { Users, Calendar, ArrowUp } from '../icons'
import { m } from 'framer-motion'
import { Link } from 'react-router'
import { AnimatedCounter, ContentTransition, SkeletonStatsRow } from '../ui'

function getSessionsTrend(count: number): { icon: typeof ArrowUp | null; color: string } {
  if (count >= 3) return { icon: ArrowUp, color: 'var(--color-success)' }
  if (count >= 1) return { icon: null, color: 'var(--color-warning)' }
  return { icon: null, color: 'var(--color-text-quaternary)' }
}

interface StatsRowProps {
  squadsCount: number
  sessionsThisWeek: number
}

function StatsRow({ squadsCount, sessionsThisWeek }: StatsRowProps) {
  const sessionsTrend = getSessionsTrend(sessionsThisWeek)

  const stats = [
    {
      value: squadsCount,
      label: 'Squads',
      mobileLabel: 'Squads',
      icon: Users,
      color: 'var(--color-primary)',
      suffix: '',
      path: '/squads',
      trend: null,
      progress: null,
    },
    {
      value: sessionsThisWeek,
      label: 'Cette semaine',
      mobileLabel: 'Cette sem.',
      icon: Calendar,
      color: 'var(--color-warning)',
      suffix: '',
      path: '/sessions',
      trend: sessionsTrend,
      progress: null,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
            className="h-auto min-h-[60px] sm:min-h-[68px] px-2 sm:px-4 py-2.5 flex flex-col gap-1.5 rounded-xl sm:rounded-2xl border border-border-hover shadow-sm hover:bg-surface-card-hover cursor-pointer transition-interactive"
            style={{
              background: `linear-gradient(to bottom right, ${stat.color}12, transparent)`,
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-lg sm:text-xl font-bold text-text-primary tracking-tight leading-none">
                    <AnimatedCounter end={stat.value} duration={1.2} suffix={stat.suffix} />
                  </span>
                  {stat.trend?.icon && (
                    <stat.trend.icon
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                      style={{ color: stat.trend.color }}
                    />
                  )}
                </div>
                <div className="text-2xs sm:text-xs text-text-quaternary uppercase tracking-wider mt-0.5 truncate font-medium">
                  <span className="sm:hidden">{stat.mobileLabel}</span>
                  <span className="hidden sm:inline">{stat.label}</span>
                </div>
              </div>
            </div>
            {stat.progress !== null && (
              <div className="w-full h-1.5 rounded-full bg-border-subtle overflow-hidden">
                <m.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: stat.trend?.color || stat.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(stat.progress, 100)}%` }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            )}
          </m.div>
        </Link>
      ))}
    </div>
  )
}

interface HomeStatsSectionProps {
  squadsCount: number
  sessionsThisWeek: number
  squadsLoading: boolean
  sessionsLoading: boolean
  profile?: { streak_days?: number; streak_last_date?: string | null } | null
}

export const HomeStatsSection = memo(function HomeStatsSection({
  squadsCount,
  sessionsThisWeek,
  squadsLoading,
  sessionsLoading,
}: HomeStatsSectionProps) {
  return (
    <section aria-label="Tableau de bord" className="mb-6">
      <h2 className="text-base font-semibold text-text-primary mb-3">Ton tableau de bord</h2>
      <ContentTransition
        isLoading={squadsLoading || sessionsLoading}
        skeleton={<SkeletonStatsRow />}
      >
        <StatsRow squadsCount={squadsCount} sessionsThisWeek={sessionsThisWeek} />
      </ContentTransition>
    </section>
  )
})
