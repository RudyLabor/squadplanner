import { m } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { Card } from './ui'
import { type LeaderboardEntry } from './leaderboard/leaderboardConfig'
import { PodiumCard } from './leaderboard/PodiumCard'
import { LeaderboardListItem } from './leaderboard/LeaderboardListItem'

interface SquadLeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId: string
}

export function SquadLeaderboard({ entries, currentUserId }: SquadLeaderboardProps) {
  const sortedEntries = [...entries].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

  const podiumEntries = sortedEntries.filter((e) => e.rank <= 3)
  const listEntries = sortedEntries.filter((e) => e.rank > 3 && e.rank <= 10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <m.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text-primary">Classement Squad</h2>
          <p className="text-sm text-text-tertiary">Top joueurs cette semaine</p>
        </div>
      </m.div>

      {/* Podium - Top 3 */}
      {podiumEntries.length > 0 && (
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {podiumEntries.map((entry, index) => (
            <PodiumCard
              key={entry.user_id}
              entry={entry}
              isCurrentUser={entry.user_id === currentUserId}
              index={index}
            />
          ))}
        </div>
      )}

      {/* List - Ranks 4-10 */}
      {listEntries.length > 0 && (
        <Card className="p-2 bg-bg-surface">
          <div className="space-y-2">
            {listEntries.map((entry, index) => (
              <LeaderboardListItem
                key={entry.user_id}
                entry={entry}
                isCurrentUser={entry.user_id === currentUserId}
                index={index}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Trophy className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-md text-text-secondary">Aucun classement disponible</p>
          <p className="text-sm text-text-tertiary">
            Participe a des sessions pour apparaitre ici !
          </p>
        </m.div>
      )}
    </div>
  )
}
