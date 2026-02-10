import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Zap, Clock, Phone, Flame, ChevronRight
} from 'lucide-react'
import { Card, Button } from '../ui'
import { PremiumGate, PremiumBadge } from '../PremiumGate'
import { FREE_HISTORY_DAYS } from '../../hooks'
import { StreakCounter } from '../StreakCounter'

interface ProfileHistoryProps {
  profile: {
    streak_days?: number
    streak_last_date?: string | null
  } | null
  hasPremium: boolean
  canAccessFeature: (feature: string) => boolean
  aiCoachTip?: { tip?: string; tone?: string } | null
}

export function ProfileHistory({ profile, hasPremium, canAccessFeature, aiCoachTip }: ProfileHistoryProps) {
  const navigate = useNavigate()

  return (
    <>
      {/* Activité Section - StreakCounter */}
      <section className="mb-5" aria-label="Activité">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-warning" />
          <h3 className="text-base font-semibold text-text-primary uppercase tracking-wide">
            Activité
          </h3>
        </div>
        <StreakCounter
          streakDays={profile?.streak_days || 0}
          lastActiveDate={profile?.streak_last_date || null}
        />
      </section>

      {/* IA Coach - Basique (gratuit) */}
      <Card className={`mb-5 p-4 bg-gradient-to-br border ${
        aiCoachTip?.tone === 'celebration'
          ? 'from-success-5 to-transparent border-success'
          : aiCoachTip?.tone === 'warning'
            ? 'from-error-5 to-transparent border-error'
            : 'from-purple-10 to-transparent border-purple'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            aiCoachTip?.tone === 'celebration'
              ? 'bg-success-15'
              : aiCoachTip?.tone === 'warning'
                ? 'bg-error-10'
                : 'bg-purple-10'
          }`}>
            <Sparkles className={`w-5 h-5 ${
              aiCoachTip?.tone === 'celebration'
                ? 'text-success'
                : aiCoachTip?.tone === 'warning'
                  ? 'text-error'
                  : 'text-purple'
            }`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-md font-semibold text-text-primary">Coach IA</h3>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                aiCoachTip?.tone === 'celebration'
                  ? 'bg-success-15 text-success'
                  : aiCoachTip?.tone === 'warning'
                    ? 'bg-error-15 text-error'
                    : 'bg-purple-15 text-purple'
              }`}>
                {aiCoachTip?.tone === 'celebration' ? 'BRAVO' : aiCoachTip?.tone === 'warning' ? 'ATTENTION' : 'CONSEIL'}
              </span>
            </div>
            <p className={`text-base leading-relaxed ${
              aiCoachTip?.tone === 'celebration'
                ? 'text-success'
                : aiCoachTip?.tone === 'warning'
                  ? 'text-error'
                  : 'text-text-tertiary'
            }`}>
              {aiCoachTip?.tip || 'Prêt pour la prochaine session ? Tes potes t\'attendent !'}
            </p>
          </div>
        </div>
      </Card>

      {/* Historique des appels */}
      <Card
        className="mb-5 p-4 bg-bg-elevated cursor-pointer"
        hoverable
        onClick={() => navigate('/call-history')}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success-15 flex items-center justify-center">
            <Phone className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1">
            <h4 className="text-md font-medium text-text-primary">Historique des appels</h4>
            <p className="text-sm text-text-quaternary">Voir tous tes appels passés</p>
          </div>
          <ChevronRight className="w-5 h-5 text-text-quaternary" />
        </div>
      </Card>

      {/* PRO sections below useful content */}

      {/* IA Coach Avancé - Premium */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-base font-semibold text-text-primary uppercase tracking-wide">
            Coach IA Avancé
          </h3>
          {!canAccessFeature('ai_coach_advanced') && <PremiumBadge small />}
        </div>
        <PremiumGate
          feature="ai_coach_advanced"
          featureLabel="Coach IA Avancé"
          fallback="lock"
        >
          <Card className="p-4 bg-gradient-to-br from-warning-5 to-transparent border-warning">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning-10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <h4 className="text-md font-medium text-text-primary mb-1">Conseils personnalisés</h4>
                <p className="text-base text-text-tertiary">
                  Prédictions de disponibilité, analyse des patterns de jeu, suggestions de créneaux optimaux pour ta squad.
                </p>
              </div>
            </div>
          </Card>
        </PremiumGate>
      </div>

      {/* Historique - Premium */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-base font-semibold text-text-primary uppercase tracking-wide">
            Historique
          </h3>
          {!canAccessFeature('unlimited_history') && (
            <span className="text-xs text-text-quaternary">
              ({FREE_HISTORY_DAYS} derniers jours)
            </span>
          )}
          {!canAccessFeature('unlimited_history') && <PremiumBadge small />}
        </div>
        <PremiumGate
          feature="unlimited_history"
          featureLabel="Historique illimité"
          fallback="lock"
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-md font-medium text-text-primary">Historique complet</h4>
                <p className="text-sm text-text-quaternary">Toutes tes sessions depuis le début</p>
              </div>
            </div>
          </Card>
        </PremiumGate>
      </div>

      {/* Premium upsell - single subtle block at the bottom */}
      {!hasPremium && (
        <Card className="mb-5 overflow-hidden bg-bg-elevated">
          <div className="h-1 bg-gradient-to-r from-primary via-warning to-success" />
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning to-warning/50 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  Passe Premium
                </h3>
                <p className="text-base text-text-tertiary mb-3">
                  Stats avancées, IA coach avancé, audio HD, historique illimité
                </p>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary to-purple"
                  onClick={() => navigate('/premium')}
                >
                  Découvrir
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Badge Premium si actif */}
      {hasPremium && (
        <Card className="mb-5 p-4 bg-gradient-to-br from-warning-10 to-transparent border-warning">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-15 flex items-center justify-center">
              <Zap className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-md font-medium text-text-primary">Compte Premium</h3>
                <PremiumBadge small />
              </div>
              <p className="text-sm text-text-quaternary">Toutes les features sont débloquées</p>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}
