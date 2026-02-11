import { useNavigate } from 'react-router-dom'
import { Zap, Phone, ChevronRight } from 'lucide-react'
import { Card, Button } from '../ui'
import { PremiumBadge } from '../PremiumGate'
import { ProfileActivityCard } from './ProfileActivityCard'
import { ProfileCoachCard } from './ProfileCoachCard'

interface ProfileHistoryProps {
  profile: {
    streak_days?: number
    streak_last_date?: string | null
    reliability_score?: number
  } | null
  hasPremium: boolean
  canAccessFeature: (feature: string) => boolean
  aiCoachTip?: { tip?: string; tone?: string } | null
}

export function ProfileHistory({ profile, hasPremium, canAccessFeature, aiCoachTip }: ProfileHistoryProps) {
  const navigate = useNavigate()
  const streakDays = profile?.streak_days || 0

  return (
    <>
      {/* Activité - Streak compact */}
      <ProfileActivityCard streakDays={streakDays} />

      {/* IA Coach - Basique (gratuit) */}
      <ProfileCoachCard
        streakDays={streakDays}
        reliabilityScore={profile?.reliability_score ?? 100}
        aiCoachTip={aiCoachTip}
      />

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

      {/* Premium features - single subtle CTA for non-premium users */}
      {!hasPremium && (
        <Card className="mb-5 p-4 bg-bg-elevated border-border-default">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-warning/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-md font-medium text-text-primary">Passe Premium</h3>
                <PremiumBadge small />
              </div>
              <p className="text-sm text-text-quaternary">
                Coach IA avancé, historique illimité, audio HD
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-primary flex-shrink-0"
              onClick={() => navigate('/premium')}
            >
              Voir
              <ChevronRight className="w-4 h-4" />
            </Button>
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
