
import { memo } from 'react'
import { m } from 'framer-motion'
import { CheckCircle2, Gamepad2, UserPlus, Activity } from '../icons'
import { Card } from '../ui'
import { useActivityFeedQuery, getRelativeTime } from '../../hooks/queries/useActivityFeedQuery'
import type { ActivityItem } from '../../hooks/queries/useActivityFeedQuery'

type ActivityType = ActivityItem['type']

interface HomeActivityFeedProps {
  squadIds: string[]
}

const activityConfig: Record<
  ActivityType,
  { icon: typeof CheckCircle2; colorClass: string; bgClass: string }
> = {
  session_rsvp: {
    icon: CheckCircle2,
    colorClass: 'text-success',
    bgClass: 'bg-success/15',
  },
  session_created: {
    icon: Gamepad2,
    colorClass: 'text-primary',
    bgClass: 'bg-primary/15',
  },
  squad_joined: {
    icon: UserPlus,
    colorClass: 'text-info',
    bgClass: 'bg-info/15',
  },
}

const ActivityRow = memo(function ActivityRow({
  item,
  index,
}: {
  item: ActivityItem
  index: number
}) {
  const config = activityConfig[item.type]
  const Icon = config.icon

  return (
    <m.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="flex items-center gap-3 py-3"
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${item.avatarColor}`}
      >
        {item.avatarInitial}
      </div>

      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bgClass}`}
      >
        <Icon className={`w-4 h-4 ${config.colorClass}`} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-base font-medium text-text-primary truncate">{item.description}</p>
        <p className="text-sm text-text-tertiary truncate">{item.detail}</p>
      </div>

      <span className="text-sm text-text-quaternary flex-shrink-0 whitespace-nowrap">
        {getRelativeTime(item.timestamp)}
      </span>
    </m.div>
  )
})

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-border-subtle flex-shrink-0" />
      <div className="w-8 h-8 rounded-lg bg-border-subtle flex-shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 bg-border-subtle rounded w-3/4" />
        <div className="h-3 bg-border-subtle rounded w-1/2" />
      </div>
      <div className="h-3 bg-border-subtle rounded w-12 flex-shrink-0" />
    </div>
  )
}

export const HomeActivityFeed = memo(function HomeActivityFeed({
  squadIds,
}: HomeActivityFeedProps) {
  const { data: activities = [], isLoading } = useActivityFeedQuery(squadIds)

  if (isLoading) {
    return (
      <section aria-label="Activité récente" className="mb-6">
        <h2 className="text-base font-semibold text-text-primary mb-3">Activité récente</h2>
        <Card className="px-4 py-1 divide-y divide-border-subtle">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </Card>
      </section>
    )
  }

  if (activities.length === 0) {
    const hasSquads = squadIds.length > 0
    return (
      <section aria-label="Activité récente" className="mb-6">
        <h2 className="text-base font-semibold text-text-primary mb-3">Activité récente</h2>
        <Card className="p-6 text-center">
          <Activity className="w-8 h-8 text-text-quaternary mx-auto mb-2" />
          <p className="text-base text-text-tertiary">Pas encore d'activité</p>
          <p className="text-sm text-text-quaternary mt-1">
            {hasSquads
              ? 'Participe à des sessions ou envoie des messages pour voir ton activité ici.'
              : "Rejoins une squad pour voir l'activité ici."}
          </p>
        </Card>
      </section>
    )
  }

  return (
    <section aria-label="Activité récente" className="mb-6">
      <h2 className="text-base font-semibold text-text-primary mb-3">Activité récente</h2>
      <Card className="px-4 py-1 divide-y divide-border-subtle">
        {activities.map((item, index) => (
          <ActivityRow key={item.id} item={item} index={index} />
        ))}
      </Card>
    </section>
  )
})
