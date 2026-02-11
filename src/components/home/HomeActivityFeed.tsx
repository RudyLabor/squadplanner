"use client";

import { memo, useMemo } from 'react'
import { m } from 'framer-motion'
import {
  CheckCircle2,
  Gamepad2,
  Trophy,
  UserPlus,
  Flame,
  PartyPopper,
  Activity,
} from '../icons'
import { Card } from '../ui'

// --- Types ---

type ActivityType =
  | 'session_rsvp'
  | 'session_created'
  | 'squad_joined'
  | 'achievement_unlocked'
  | 'streak_milestone'
  | 'party_started'

interface ActivityItem {
  id: string
  type: ActivityType
  description: string
  detail: string
  relativeTime: string
  avatarInitial: string
  avatarColor: string
}

interface Squad {
  id: string
  name: string
  game?: string
  member_count?: number
  total_members?: number
}

interface HomeActivityFeedProps {
  squads: Squad[]
}

// --- Helpers ---

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
  achievement_unlocked: {
    icon: Trophy,
    colorClass: 'text-warning',
    bgClass: 'bg-warning/15',
  },
  streak_milestone: {
    icon: Flame,
    colorClass: 'text-error',
    bgClass: 'bg-error/15',
  },
  party_started: {
    icon: PartyPopper,
    colorClass: 'text-secondary',
    bgClass: 'bg-secondary/15',
  },
}

const MOCK_NAMES = ['Alex', 'Marie', 'Sami', 'Jade', 'Noah', 'Lina']
const MOCK_GAMES = ['Apex Legends', 'Valorant', 'Fortnite', 'Rocket League', 'Overwatch 2']
const AVATAR_COLORS = [
  'bg-primary/20 text-primary',
  'bg-success/20 text-success',
  'bg-warning/20 text-warning',
  'bg-info/20 text-info',
  'bg-error/20 text-error',
  'bg-secondary/20 text-secondary',
]

function pickRandom<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]
}

function generateMockActivities(squads: Squad[]): ActivityItem[] {
  if (squads.length === 0) return []

  const activities: ActivityItem[] = []
  let idCounter = 0

  // 1. session_rsvp - someone confirmed for a session
  const squad1 = pickRandom(squads, 0)
  const name1 = pickRandom(MOCK_NAMES, 1)
  activities.push({
    id: `activity-${idCounter++}`,
    type: 'session_rsvp',
    description: `${name1} a confirmé sa présence`,
    detail: `Session Ranked - ${squad1.name}`,
    relativeTime: 'il y a 2h',
    avatarInitial: name1[0],
    avatarColor: pickRandom(AVATAR_COLORS, 1),
  })

  // 2. session_created - new session in a squad
  const squad2 = pickRandom(squads, 2)
  const game2 = squad2.game || pickRandom(MOCK_GAMES, 3)
  activities.push({
    id: `activity-${idCounter++}`,
    type: 'session_created',
    description: 'Nouvelle session créée',
    detail: `${game2} - ${squad2.name}`,
    relativeTime: 'il y a 3h',
    avatarInitial: squad2.name[0],
    avatarColor: pickRandom(AVATAR_COLORS, 2),
  })

  // 3. achievement_unlocked - user unlocked a badge
  activities.push({
    id: `activity-${idCounter++}`,
    type: 'achievement_unlocked',
    description: 'Tu as débloqué le badge "Régulier"',
    detail: '5 sessions confirmées',
    relativeTime: 'il y a 5h',
    avatarInitial: 'T',
    avatarColor: pickRandom(AVATAR_COLORS, 4),
  })

  // 4. squad_joined - someone joined a squad
  const squad4 = pickRandom(squads, 4)
  const name4 = pickRandom(MOCK_NAMES, 5)
  activities.push({
    id: `activity-${idCounter++}`,
    type: 'squad_joined',
    description: `${name4} a rejoint ta squad`,
    detail: squad4.name,
    relativeTime: 'il y a 1j',
    avatarInitial: name4[0],
    avatarColor: pickRandom(AVATAR_COLORS, 5),
  })

  // 5. streak_milestone - streak reached
  activities.push({
    id: `activity-${idCounter++}`,
    type: 'streak_milestone',
    description: 'Série de 7 jours atteinte !',
    detail: 'Continue comme ça',
    relativeTime: 'il y a 2j',
    avatarInitial: 'T',
    avatarColor: pickRandom(AVATAR_COLORS, 3),
  })

  return activities.slice(0, 5)
}

// --- Component ---

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
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${item.avatarColor}`}
      >
        {item.avatarInitial}
      </div>

      {/* Icon circle */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bgClass}`}
      >
        <Icon className={`w-4 h-4 ${config.colorClass}`} />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium text-text-primary truncate">
          {item.description}
        </p>
        <p className="text-sm text-text-tertiary truncate">{item.detail}</p>
      </div>

      {/* Time */}
      <span className="text-sm text-text-quaternary flex-shrink-0 whitespace-nowrap">
        {item.relativeTime}
      </span>
    </m.div>
  )
})

export const HomeActivityFeed = memo(function HomeActivityFeed({
  squads,
}: HomeActivityFeedProps) {
  const activities = useMemo(() => generateMockActivities(squads), [squads])

  if (activities.length === 0) {
    return (
      <section aria-label="Activité récente" className="mb-6">
        <h2 className="text-base font-semibold text-text-primary mb-3">
          Activité récente
        </h2>
        <Card className="p-6 text-center">
          <Activity className="w-8 h-8 text-text-quaternary mx-auto mb-2" />
          <p className="text-base text-text-tertiary">
            Pas encore d'activité
          </p>
          <p className="text-sm text-text-quaternary mt-1">
            Rejoins une squad pour voir l'activité ici
          </p>
        </Card>
      </section>
    )
  }

  return (
    <section aria-label="Activité récente" className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-semibold text-text-primary">
          Activité récente
        </h2>
        <span className="text-xs text-text-quaternary italic px-2 py-0.5 rounded-full bg-border-subtle">Aperçu</span>
      </div>
      <Card className="px-4 py-1 divide-y divide-border-subtle">
        {activities.map((item, index) => (
          <ActivityRow key={item.id} item={item} index={index} />
        ))}
      </Card>
    </section>
  )
})
