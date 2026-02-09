import { memo } from 'react'
import { motion } from 'framer-motion'
import { Compass, Search } from 'lucide-react'
import { SegmentedControl, Select } from '../components/ui'
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
  { value: 'na', label: 'Amerique du Nord' },
  { value: 'asia', label: 'Asie' },
  { value: 'oce', label: 'Oceanie' },
]

export function Discover() {
  const [tab, setTab] = useStatePersistence<Tab>('discover_tab', 'squads')
  const [game, setGame] = useStatePersistence('discover_game', '')
  const [region, setRegion] = useStatePersistence('discover_region', '')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto px-4 py-6 pb-24"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <Compass className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Decouvrir</h1>
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
            placeholder="Toutes les regions"
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
      <div className="text-center py-12">
        <Search className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-50" />
        <p className="text-sm text-text-tertiary">Aucune squad publique trouvee</p>
        <p className="text-xs text-text-tertiary mt-1">Les leaders peuvent rendre leur squad publique dans les parametres</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {squads.map(squad => (
        <DiscoverSquadCard key={squad.id} squad={squad} />
      ))}
      {/* Sentinel element for infinite scroll */}
      <div ref={sentinelRef} aria-hidden="true" />
    </div>
  )
})

export default Discover
