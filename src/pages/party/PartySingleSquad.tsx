import { m } from 'framer-motion'
import { Mic, Loader2, Zap, Clock, TrendingUp, Users } from '../../components/icons'
import { Card, Button } from '../../components/ui'

export function PartySingleSquad({
  squad,
  isConnecting,
  onJoin,
}: {
  squad: { id: string; name: string; game: string; member_count?: number; total_members?: number }
  isConnecting: boolean
  onJoin: () => void
}) {
  const memberCount = squad.member_count ?? squad.total_members ?? 1
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card className="md:col-span-3 p-8 text-center bg-gradient-to-br from-primary/10 via-bg-elevated to-success/5 border-primary shadow-md">
        <div className="relative w-20 h-20 mx-auto mb-5">
          <m.div
            className="absolute inset-0 rounded-2xl bg-primary/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <m.div
            className="absolute inset-0 rounded-2xl bg-primary/15"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          />
          <m.div
            className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple flex items-center justify-center shadow-lg shadow-primary/15"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Mic className="w-9 h-9 text-white" />
          </m.div>
        </div>
        <h3 className="text-lg font-bold text-text-primary mb-2">Prêt à parler ?</h3>
        <p className="text-base text-text-secondary mb-2">{squad.name}</p>
        <p className="text-sm text-text-tertiary mb-3">
          {squad.game} · {memberCount} membre{memberCount > 1 ? 's' : ''}
        </p>
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="flex -space-x-2">
            {Array.from({ length: Math.min(memberCount, 4) }).map((_, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full bg-primary/20 border-2 border-bg-base flex items-center justify-center"
              >
                <span className="text-xs font-bold text-primary">
                  {String.fromCharCode(65 + i)}
                </span>
              </div>
            ))}
          </div>
          <span className="text-sm text-text-tertiary">
            {memberCount} membre{memberCount > 1 ? 's' : ''} dans la squad
          </span>
        </div>
        <Button
          onClick={onJoin}
          disabled={isConnecting}
          className="shadow-md shadow-primary/10 px-8"
        >
          {isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mic className="w-4 h-4" />
          )}{' '}
          Lancer la party
        </Button>
      </Card>

      <div className="md:col-span-2 hidden md:flex flex-col gap-3">
        <PartyStatsCard squadName={squad.name} />
      </div>
    </div>
  )
}

export function PartyStatsCard({ squadName: _squadName }: { squadName: string }) {
  return (
    <>
      <Card className="p-4 bg-bg-elevated border-border-default">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Party vocale</p>
            <p className="text-xs text-text-tertiary">Statistiques</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-text-tertiary" />
              Durée moyenne
            </span>
            <span className="text-sm font-medium text-text-tertiary italic">--</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-text-tertiary" />
              Cette semaine
            </span>
            <span className="text-sm font-medium text-text-tertiary italic">--</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-text-tertiary" />
              Participants moy.
            </span>
            <span className="text-sm font-medium text-text-tertiary italic">--</span>
          </div>
        </div>
        <p className="text-xs text-text-quaternary mt-3 text-center italic">
          Bientôt disponible
        </p>
      </Card>
      <Card className="p-4 bg-bg-elevated border-border-default flex-1">
        <p className="text-sm font-semibold text-text-primary mb-3">Historique récent</p>
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-xs text-text-quaternary italic">Aucune party enregistrée</p>
          <p className="text-xs text-text-quaternary mt-1">
            Lance ta première party pour voir l'historique ici
          </p>
        </div>
      </Card>
    </>
  )
}
