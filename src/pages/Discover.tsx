import { memo } from 'react'
import { motion } from 'framer-motion'
import { Compass, Plus, Sparkles, Users, Gamepad2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SegmentedControl, Select, Card, Button } from '../components/ui'
import type { SelectOption } from '../components/ui'
import { DiscoverSquadCard } from '../components/discover/DiscoverSquadCard'
import { GlobalLeaderboard } from '../components/discover/GlobalLeaderboard'
import { MatchmakingSection } from '../components/discover/MatchmakingSection'
import { useBrowseSquadsQuery } from '../hooks/queries'
import { useStatePersistence } from '../hooks/useStatePersistence'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { LoadingMore } from '../components/ui/LoadingMore'

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
  const [tab, setTab] = useStatePersistence<Tab>('discover_tab', 'squads')
  const [game, setGame] = useStatePersistence('discover_game', '')
  const [region, setRegion] = useStatePersistence('discover_region', '')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-6 pb-24"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <Compass className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary">Découvrir</h1>
          <p className="text-xs text-text-tertiary">Trouve des squads et joueurs</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={TABS}
        />
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
      {tab === 'joueurs' && <MatchmakingSection game={game || undefined} region={region || undefined} />}
      {tab === 'classement' && <GlobalLeaderboard game={game || undefined} region={region || undefined} />}
    </motion.div>
  )
}

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
        {/* Engaging empty state */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-10"
        >
          <motion.div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-purple/10 flex items-center justify-center mx-auto mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Compass className="w-8 h-8 text-primary" />
          </motion.div>
          <h3 className="text-lg font-bold text-text-primary mb-2">Aucune squad publique trouvée</h3>
          <p className="text-sm text-text-secondary mb-1">Sois le premier à créer une squad publique !</p>
          <p className="text-xs text-text-tertiary mb-5">Les leaders peuvent rendre leur squad publique dans les paramètres</p>
          <Link to="/squads">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4" />
              Créer une squad
            </Button>
          </Link>
        </motion.div>

        {/* Featured squads placeholder section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Squads populaires</h3>
          </div>
          <div className="space-y-2 lg:grid lg:grid-cols-3 lg:gap-3 lg:space-y-0">
            {[
              { name: 'Les Gamers FR', game: 'Valorant', members: 8, desc: 'Squad compétitive Valorant' },
              { name: 'Rocket Masters', game: 'Rocket League', members: 5, desc: 'Du freestyle au ranked' },
              { name: 'Fortnite Squad', game: 'Fortnite', members: 12, desc: 'Build & chill' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border-subtle bg-surface-card p-4 opacity-60"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Gamepad2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-text-primary">{s.name}</h4>
                    <p className="text-xs text-primary font-medium">{s.game}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{s.desc}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-text-tertiary mt-1">
                      <Users className="w-3 h-3" /> {s.members} membres
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
      {squads.map(squad => (
        <DiscoverSquadCard key={squad.id} squad={squad} />
      ))}
      {/* Sentinel element for infinite scroll */}
      <div ref={sentinelRef} aria-hidden="true" />
    </div>
  )
})

export default Discover
