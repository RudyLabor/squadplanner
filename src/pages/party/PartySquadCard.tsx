import { m } from 'framer-motion'
import { Mic, Gamepad2, Loader2 } from 'lucide-react'
import { Card, Button } from '../../components/ui'

export function PartySquadCard({ squad, onJoin, isConnecting }: {
  squad: { id: string; name: string; game: string; member_count: number }
  onJoin: () => void
  isConnecting: boolean
}) {
  return (
    <m.div whileHover={{ y: -1, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <Card className="p-4 bg-gradient-to-br from-primary/[0.08] to-transparent border-primary hover:border-primary transition-interactive">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple flex items-center justify-center shadow-md shadow-primary/10">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-md font-semibold text-text-primary truncate">{squad.name}</h3>
            <p className="text-sm text-text-secondary">{squad.game} · {squad.member_count} membre{squad.member_count > 1 ? 's' : ''}</p>
          </div>
          <Button size="sm" variant="primary" onClick={onJoin} disabled={isConnecting} className="shadow-md shadow-primary/10">
            {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mic className="w-4 h-4" /> Rejoindre</>}
          </Button>
        </div>
      </Card>
    </m.div>
  )
}
