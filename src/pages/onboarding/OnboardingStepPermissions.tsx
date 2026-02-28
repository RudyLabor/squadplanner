import { m, type Variants } from 'framer-motion'
import { Bell, Mic, ArrowLeft, Check } from '../../components/icons'
import { Button, Card } from '../../components/ui'

interface OnboardingStepPermissionsProps {
  slideVariants: Variants
  notifPermission: 'granted' | 'denied' | 'default'
  micPermission: 'granted' | 'denied' | 'prompt'
  isNavigating: boolean
  onRequestNotifications: () => void
  onRequestMic: () => void
  onSkipMic: () => void
  canProceed: boolean
  onComplete: () => void
  onBack: () => void
}

export function OnboardingStepPermissions({
  slideVariants,
  notifPermission,
  micPermission,
  isNavigating,
  onRequestNotifications,
  onRequestMic,
  onSkipMic,
  canProceed,
  onComplete,
  onBack,
}: OnboardingStepPermissionsProps) {
  return (
    <m.div key="permissions" variants={slideVariants} initial="enter" animate="center" exit="exit">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-text-primary mb-2">Ne rate jamais une session</h2>
        <p className="text-text-secondary">On te prévient quand ta squad t'attend</p>
      </div>

      <div className="space-y-4">
        {/* Notifications */}
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning-10 flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6 text-warning" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-text-primary">Notifications</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-warning-10 text-warning font-medium">
                  Recommandé
                </span>
              </div>
              <p className="text-base text-text-secondary mb-3">
                Sois prévenu quand une session est créée ou quand ta squad
                t'attend
              </p>
              {notifPermission === 'granted' ? (
                <div className="flex items-center gap-2 text-success text-base">
                  <Check className="w-4 h-4" />
                  Activées
                </div>
              ) : notifPermission === 'denied' ? (
                <div className="space-y-1.5">
                  <p className="text-base text-warning font-medium">
                    Notifications bloquées
                  </p>
                  <p className="text-sm text-text-tertiary">
                    Pour les activer : clique sur l'icône cadenas à gauche de la barre
                    d'adresse, puis autorise les notifications pour ce site.
                  </p>
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={onRequestNotifications}>
                  Activer les notifications
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Microphone */}
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-10 flex items-center justify-center shrink-0">
              <Mic className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-text-primary">Microphone</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-border-subtle text-text-secondary font-medium">
                  Optionnel
                </span>
              </div>
              <p className="text-base text-text-secondary mb-3">
                Pour la party vocale avec ta squad. Tu peux activer plus tard.
              </p>
              {micPermission === 'granted' ? (
                <div className="flex items-center gap-2 text-success text-base">
                  <Check className="w-4 h-4" />
                  Autorisé
                </div>
              ) : micPermission === 'denied' ? (
                <div className="space-y-1.5">
                  <p className="text-base text-warning font-medium">Micro bloqué</p>
                  <p className="text-sm text-text-tertiary">
                    Pour l'activer : clique sur l'icône cadenas à gauche de la barre
                    d'adresse de ton navigateur, puis autorise le microphone. Tu peux aussi le faire
                    plus tard dans les paramètres.
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={onRequestMic}>
                    Autoriser le micro
                  </Button>
                  <button
                    onClick={onSkipMic}
                    className="text-base text-text-tertiary hover:text-text-secondary px-3"
                  >
                    Plus tard
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 space-y-3">
        {canProceed ? (
          <Button
            onClick={onComplete}
            data-testid="permissions-continue-button"
            className="w-full h-12"
            disabled={isNavigating}
          >
            Terminer
            <Check className="w-5 h-5 ml-2" />
          </Button>
        ) : (
          <>
            <Button
              onClick={onComplete}
              data-testid="permissions-continue-button"
              className="w-full h-12"
              disabled={isNavigating}
            >
              Terminer
              <Check className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-text-tertiary text-center">
              Tu pourras activer les notifications plus tard dans les paramètres
            </p>
          </>
        )}
      </div>
    </m.div>
  )
}
