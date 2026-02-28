import { m } from 'framer-motion'
import { Mic, Gamepad2, Loader2, Users } from '../../components/icons'
import { Card, Button } from '../../components/ui'
import type { SquadActiveParty } from '../../hooks/useActiveSquadParties'

export function PartySquadCard({
  squad,
  onJoin,
  isConnecting,
  activeParty,
}: {
  squad: { id: string; name: string; game: string; member_count: number }
  onJoin: () => void
  isConnecting: boolean
  activeParty?: SquadActiveParty
}) {
  const hasActiveParty = activeParty && activeParty.members.length > 0
  const memberNames = activeParty?.members.map((m) => m.username).join(', ')

  return (
    <m.div whileHover={{ y: -1, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <Card
        className={`p-4 bg-gradient-to-br border transition-interactive ${
          hasActiveParty
            ? 'from-success/[0.12] to-transparent border-success/40 hover:border-success'
            : 'from-primary/[0.08] to-transparent border-primary hover:border-primary'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md ${
              hasActiveParty
                ? 'from-success to-emerald-400 shadow-success/10'
                : 'from-primary to-purple shadow-primary/10'
            }`}
          >
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-text-primary truncate">{squad.name}</h3>
            <p className="text-sm text-text-secondary">
              {squad.game} · {squad.member_count} membre{squad.member_count > 1 ? 's' : ''}
            </p>
            {hasActiveParty && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <p className="text-xs font-medium text-success truncate">
                  <Users className="w-3 h-3 inline mr-1" />
                  {activeParty.members.length} en party : {memberNames}
                </p>
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant={hasActiveParty ? 'secondary' : 'primary'}
            onClick={onJoin}
            disabled={isConnecting}
            className={
              hasActiveParty
                ? 'shadow-md shadow-success/10 bg-success hover:bg-success/90 text-white'
                : 'shadow-md shadow-primary/10'
            }
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Mic className="w-4 h-4" /> {hasActiveParty ? 'Rejoindre' : 'Lancer'}
              </>
            )}
          </Button>
        </div>
      </Card>
    </m.div>
  )
}
