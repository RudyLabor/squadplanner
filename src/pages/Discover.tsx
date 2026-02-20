
import { memo, useState, useCallback } from 'react'
import { m } from 'framer-motion'
import { Compass, Plus, Sparkles, Users, Gamepad2 } from '../components/icons'
import { Link } from 'react-router'
import { MobilePageHeader } from '../components/layout/MobilePageHeader'
import { SegmentedControl, Select } from '../components/ui'
import type { SelectOption } from '../components/ui'
import { DiscoverSquadCard } from '../components/discover/DiscoverSquadCard'
import { GlobalLeaderboard } from '../components/discover/GlobalLeaderboard'
import { MatchmakingSection } from '../components/discover/MatchmakingSection'
import { useBrowseSquadsQuery } from '../hooks/queries'
import { PullToRefresh } from '../components/PullToRefresh'
import { queryClient } from '../lib/queryClient'
import type { PublicSquadResult } from '../types/database'
import { useStatePersistence } from '../hooks/useStatePersistence'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
type Tab = 'squads' | 'joueurs' | 'classement'

const TABS: { value: Tab; label: string }[] = [
  { value: 'squads', label: 'Squads' },
  { value: 'joueurs', label: 'Joueurs' },
  { value: 'classement', label: 'Classement' },
]

const GAME_OPTIONS: SelectOption[] = [
  { value: 'Valorant', label: 'Valorant' },
  { value: 'League of Legends', label: 'League of Legends' },
  { value: 'Fortnite', label: 'Fortnite' },
  { value: 'Rocket League', label: 'Rocket League' },
  { value: 'CS2', label: 'CS2' },
  { value: 'Apex Legends', label: 'Apex Legends' },
  { value: 'Minecraft', label: 'Minecraft' },
  { value: 'FIFA', label: 'FIFA' },
  { value: 'Call of Duty', label: 'Call of Duty' },
]
const REGION_OPTIONS: SelectOption[] = [
  { value: 'eu-west', label: 'Europe Ouest' },
  { value: 'eu-east', label: 'Europe Est' },
  { value: 'na', label: 'Amérique du Nord' },
  { value: 'asia', label: 'Asie' },
  { value: 'oce', label: 'Océanie' },
]

export function Discover() {
  const [tab, setTab] = useState<Tab>('squads')
  const [game, setGame] = useStatePersistence('discover_game', '')
  const [region, setRegion] = useStatePersistence('discover_region', '')

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['browse-squads'] })
  }, [])

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-6 pb-24"
    >
      <MobilePageHeader title="Découvrir" />
      {/* Header - hidden on mobile where MobilePageHeader is shown */}
      <div className="hidden lg:flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-10 flex items-center justify-center">
          <Compass className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary">Découvrir</h1>
          <p className="text-xs text-text-tertiary">Trouve des squads et joueurs</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <SegmentedControl value={tab} onChange={setTab} options={TABS} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        <div className="flex-1">
          <Select
            options={GAME_OPTIONS}
            value={game || undefined}
            onChange={(v) => setGame(v as string)}
            placeholder="Tous les jeux"
            clearable
            size="sm"
          />
        </div>
        <div className="flex-1">
          <Select
            options={REGION_OPTIONS}
            value={region || undefined}
            onChange={(v) => setRegion(v as string)}
            placeholder="Toutes les régions"
            clearable
            size="sm"
          />
        </div>
      </div>

      {/* Content */}
      {tab === 'squads' && <SquadsTab game={game} region={region} />}
      {tab === 'joueurs' && (
        <MatchmakingSection game={game || undefined} region={region || undefined} />
      )}
      {tab === 'classement' && (
        <GlobalLeaderboard game={game || undefined} region={region || undefined} />
      )}
    </m.div>
    </PullToRefresh>
  )
}

// Featured squads section shown at the top when squads are available
const FeaturedSection = memo(function FeaturedSection({ squads }: { squads: PublicSquadResult[] }) {
  if (!squads || squads.length < 2) return null

  // Pick top 3 squads by member count as "featured"
  const featured = [...squads]
    .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
    .slice(0, 3)

  if (featured.length === 0) return null

  return (
    <section className="mb-6" aria-label="Squads en vedette">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-text-primary">En vedette</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {featured.map((squad) => (
          <div
            key={squad.id}
            className="flex-shrink-0 w-64 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Gamepad2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-text-primary truncate">{squad.name}</h4>
                <p className="text-xs text-primary font-medium">{squad.game || 'Multi-jeux'}</p>
                <span className="inline-flex items-center gap-1 text-xs text-text-tertiary mt-1">
                  <Users className="w-3 h-3" /> {Math.max(squad.member_count || 0, 1)}{' '}
                  {Math.max(squad.member_count || 0, 1) === 1 ? 'membre' : 'membres'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
})

const SquadsTab = memo(function SquadsTab({ game, region }: { game: string; region: string }) {
  const { data: squads, isLoading } = useBrowseSquadsQuery(game || undefined, region || undefined)

  // Infinite scroll preparation - ready for useInfiniteQuery migration
  const { sentinelRef } = useInfiniteScroll({
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: () => {},
    enabled: !isLoading && !!squads && squads.length > 0,
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-overlay-faint animate-pulse" />
        ))}
      </div>
    )
  }

  if (!squads || squads.length === 0) {
    return (
      <div className="space-y-6">
        {/* UX-6: Improved empty state with actionable tips */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-10"
        >
          <m.div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-purple/10 flex items-center justify-center mx-auto mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Compass className="w-8 h-8 text-primary" />
          </m.div>
          <h2 className="text-lg font-bold text-text-primary mb-2">
            La communauté se construit !
          </h2>
          <p className="text-sm text-text-secondary mb-1">
            Les squads publiques apparaîtront ici dès qu'elles seront créées.
          </p>
          <p className="text-xs text-text-tertiary mb-5">
            En attendant, crée ta squad et invite tes amis par code d'invitation.
          </p>
          <Link to="/squads" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors">
            <Plus className="w-4 h-4" />
            Créer une squad
          </Link>
        </m.div>

        {/* Tips for squad leaders */}
        <div className="rounded-xl border border-border-subtle bg-surface-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-text-primary">Comment ça marche ?</span>
          </div>
          <div className="space-y-2.5 text-sm text-text-secondary">
            <p>1. <strong className="text-text-primary">Crée ta squad</strong> et invite tes amis via un code ou lien.</p>
            <p>2. <strong className="text-text-primary">Planifie des sessions</strong> — ta squad vote et tout le monde s'engage.</p>
            <p>3. <strong className="text-text-primary">Rends-la publique</strong> dans les paramètres pour qu'elle apparaisse ici.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <FeaturedSection squads={squads} />
      <div className="space-y-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0 stagger-enter">
        {squads.map((squad) => (
          <DiscoverSquadCard key={squad.id} squad={squad} />
        ))}
        {/* Sentinel element for infinite scroll */}
        <div ref={sentinelRef} aria-hidden="true" />
      </div>
    </div>
  )
})

export default Discover
