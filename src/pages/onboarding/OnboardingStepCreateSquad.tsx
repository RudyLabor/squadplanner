import { m } from 'framer-motion'
import {
  Users,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from '../../components/icons'
import { Button, Card, Input } from '../../components/ui'

interface OnboardingStepCreateSquadProps {
  slideVariants: Record<string, unknown>
  squadName: string
  squadGame: string
  error: string | null
  isLoading: boolean
  onSquadNameChange: (value: string) => void
  onSquadGameChange: (value: string) => void
  onCreateSquad: () => void
  onBack: () => void
}

export function OnboardingStepCreateSquad({
  slideVariants, squadName, squadGame, error, isLoading,
  onSquadNameChange, onSquadGameChange, onCreateSquad, onBack
}: OnboardingStepCreateSquadProps) {
  return (
    <m.div
      key="create-squad"
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary-10 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          Cr&eacute;e ta squad
        </h2>
        <p className="text-text-secondary">
          Donne-lui un nom et choisis votre jeu principal
        </p>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <Input
            label="Nom de la squad"
            value={squadName}
            onChange={(e) => onSquadNameChange(e.target.value)}
            placeholder="Ex: Les Ranked du Soir"
            autoComplete="off"
            data-testid="squad-name-input"
            required
          />

          <Input
            label="Jeu principal"
            value={squadGame}
            onChange={(e) => onSquadGameChange(e.target.value)}
            placeholder="Ex: Valorant, LoL, CS2..."
            autoComplete="off"
            data-testid="squad-game-input"
          />

          {error && (
            <div className="p-3 rounded-lg bg-error-5 border border-error">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          <Button
            onClick={onCreateSquad}
            disabled={isLoading}
            className="w-full h-12"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Cr&eacute;ation...
              </>
            ) : (
              <>
                Cr&eacute;er ma squad
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </m.div>
  )
}
