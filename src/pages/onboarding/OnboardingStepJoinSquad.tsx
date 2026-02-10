import { motion } from 'framer-motion'
import { UserPlus, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button, Card, Input } from '../../components/ui'

interface OnboardingStepJoinSquadProps {
  slideVariants: Record<string, unknown>
  inviteCode: string
  error: string | null
  isLoading: boolean
  onInviteCodeChange: (value: string) => void
  onJoinSquad: () => void
  onBack: () => void
}

export function OnboardingStepJoinSquad({
  slideVariants, inviteCode, error, isLoading,
  onInviteCodeChange, onJoinSquad, onBack
}: OnboardingStepJoinSquadProps) {
  return (
    <motion.div
      key="join-squad"
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
        <div className="w-16 h-16 rounded-2xl bg-success-10 flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          Rejoins une squad
        </h2>
        <p className="text-text-secondary">
          Entre le code que ton ami t'a donn&eacute;
        </p>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <Input
            label="Code d'invitation"
            value={inviteCode}
            onChange={(e) => onInviteCodeChange(e.target.value.toUpperCase())}
            placeholder="Ex: ABC123"
            className="text-center text-xl tracking-widest font-mono"
            autoComplete="off"
            data-testid="invite-code-input"
            maxLength={8}
          />

          {error && (
            <div className="p-3 rounded-lg bg-error-5 border border-error">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          <Button
            onClick={onJoinSquad}
            disabled={isLoading}
            className="w-full h-12"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Connexion...
              </>
            ) : (
              <>
                Rejoindre
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
