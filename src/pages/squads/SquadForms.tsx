import { motion, AnimatePresence } from 'framer-motion'
import { Users, Gamepad2, Link as LinkIcon, Loader2 } from 'lucide-react'
import { Button, Card, CardContent, Input } from '../../components/ui'

interface JoinSquadFormProps {
  show: boolean
  inviteCode: string
  onInviteCodeChange: (value: string) => void
  error: string | null
  isLoading: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export function JoinSquadForm({ show, inviteCode, onInviteCodeChange, error, isLoading, onSubmit, onCancel }: JoinSquadFormProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-6 overflow-hidden"
        >
          <Card>
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Rejoindre une squad</h3>
              <form onSubmit={onSubmit} className="space-y-4">
                <Input
                  label="Code d'invitation"
                  value={inviteCode}
                  onChange={(e) => onInviteCodeChange(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  icon={<LinkIcon className="w-5 h-5" />}
                />
                {error && (
                  <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                    <p className="text-error text-base">{error}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="ghost" onClick={onCancel}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rejoindre'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface CreateSquadFormProps {
  show: boolean
  name: string
  onNameChange: (value: string) => void
  game: string
  onGameChange: (value: string) => void
  error: string | null
  isLoading: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export function CreateSquadForm({ show, name, onNameChange, game, onGameChange, error, isLoading, onSubmit, onCancel }: CreateSquadFormProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-6 overflow-hidden"
        >
          <Card>
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Créer une squad</h3>
              <form onSubmit={onSubmit} className="space-y-4">
                <Input
                  label="Nom de la squad"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Les Légendes"
                  icon={<Users className="w-5 h-5" />}
                />
                <Input
                  label="Jeu principal"
                  value={game}
                  onChange={(e) => onGameChange(e.target.value)}
                  placeholder="Valorant, LoL, Fortnite..."
                  icon={<Gamepad2 className="w-5 h-5" />}
                />
                {error && (
                  <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                    <p className="text-error text-base">{error}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="ghost" onClick={onCancel}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
