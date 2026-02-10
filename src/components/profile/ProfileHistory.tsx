import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Zap, Clock, Phone, Flame, ChevronRight, CalendarPlus, BarChart3, Gift
} from 'lucide-react'
import { Card, Button } from '../ui'
import { PremiumGate, PremiumBadge } from '../PremiumGate'
import { FREE_HISTORY_DAYS } from '../../hooks'

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

// --- Dynamic Tips Engine ---

interface DynamicTip {
  text: string
  badge: string
}

function buildTipPool(streakDays: number, reliability: number): DynamicTip[] {
  const tips: DynamicTip[] = []

  // Streak-based tips
  if (streakDays > 0) {
    tips.push({
      text: `Ta série de ${streakDays} jour${streakDays > 1 ? 's' : ''} est impressionnante ! Continue comme ça pour débloquer le prochain palier.`,
      badge: 'STREAK',
    })
  }
  if (streakDays >= 7) {
    tips.push({
      text: `${streakDays} jours d’affilée ! Tu fais partie du top 10% des joueurs les plus réguliers.`,
      badge: 'ELITE',
    })
  }

  // Reliability-based tips
  if (reliability >= 90) {
    tips.push({
      text: 'Score de fiabilité excellent ! Ta squad peut compter sur toi.',
      badge: 'BRAVO',
    })
  } else if (reliability >= 70 && reliability < 90) {
    tips.push({
      text: `${Math.round(reliability)}% de fiabilité, c’est solide. Quelques sessions confirmées de plus et tu passes au niveau supérieur !`,
      badge: 'CONSEIL',
    })
  } else if (reliability < 70) {
    tips.push({
      text: 'Ton score de fiabilité peut s’améliorer. Confirme tes prochaines sessions pour le booster !',
      badge: 'ATTENTION',
    })
  }

  // Generic tips (always included)
  tips.push(
    { text: 'Invite un ami dans ta squad pour des sessions encore plus fun.', badge: 'CONSEIL' },
    { text: 'Planifie ta prochaine session pour maintenir ta dynamique.', badge: 'CONSEIL' },
    { text: 'Les joueurs réguliers progressent 3x plus vite. Reste constant !', badge: 'CONSEIL' },
    { text: 'Consulte tes stats pour voir ta progression et identifier tes points forts.', badge: 'CONSEIL' },
  )

  return tips
}

// --- Typing animation hook ---

function useTypingEffect(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    setDisplayed('')
    setIsTyping(true)
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        setIsTyping(false)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return { displayed, isTyping }
}

// --- Main Component ---

export function ProfileHistory({ profile, hasPremium, canAccessFeature, aiCoachTip }: ProfileHistoryProps) {
  const navigate = useNavigate()
  const [tipIndex, setTipIndex] = useState(0)

  const hasRealTip = !!(aiCoachTip?.tip)

  // Build the contextual tip pool from profile data
  const tipPool = useMemo(
    () => buildTipPool(profile?.streak_days || 0, profile?.reliability_score ?? 100),
    [profile?.streak_days, profile?.reliability_score]
  )

  // Current dynamic tip
  const currentTip = tipPool[tipIndex % tipPool.length]

  // Rotate tips every 8 seconds when no real AI tip is present
  useEffect(() => {
    if (hasRealTip || tipPool.length <= 1) return
    const timer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % tipPool.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [hasRealTip, tipPool.length])

  // Typing animation for dynamic tips
  const dynamicText = hasRealTip ? '' : currentTip?.text || ''
  const { displayed: typedText, isTyping } = useTypingEffect(dynamicText)

  // Determine visual style based on tone (for real tips) or badge (for dynamic tips)
  const getStyle = useCallback(() => {
    if (hasRealTip) {
      const tone = aiCoachTip?.tone
      if (tone === 'celebration') return { border: 'border-success', gradient: 'from-success-5', bg: 'bg-success-15', iconColor: 'text-success', textColor: 'text-success', badgeBg: 'bg-success-15 text-success', badgeLabel: 'BRAVO' }
      if (tone === 'warning') return { border: 'border-error', gradient: 'from-error-5', bg: 'bg-error-10', iconColor: 'text-error', textColor: 'text-error', badgeBg: 'bg-error-15 text-error', badgeLabel: 'ATTENTION' }
      return { border: 'border-purple', gradient: 'from-purple-10', bg: 'bg-purple-10', iconColor: 'text-purple', textColor: 'text-text-primary', badgeBg: 'bg-purple-15 text-purple', badgeLabel: 'CONSEIL' }
    }

    // Dynamic tip styling
    const badge = currentTip?.badge
    if (badge === 'BRAVO' || badge === 'ELITE' || badge === 'STREAK') {
      return { border: 'border-success', gradient: 'from-success-5', bg: 'bg-success-15', iconColor: 'text-success', textColor: 'text-success', badgeBg: 'bg-success-15 text-success', badgeLabel: badge }
    }
    if (badge === 'ATTENTION') {
      return { border: 'border-error', gradient: 'from-error-5', bg: 'bg-error-10', iconColor: 'text-error', textColor: 'text-error', badgeBg: 'bg-error-15 text-error', badgeLabel: badge }
    }
    return { border: 'border-purple', gradient: 'from-purple-10', bg: 'bg-purple-10', iconColor: 'text-purple', textColor: 'text-text-primary', badgeBg: 'bg-purple-15 text-purple', badgeLabel: 'CONSEIL' }
  }, [hasRealTip, aiCoachTip?.tone, currentTip?.badge])

  const style = getStyle()

  const streakDays = profile?.streak_days || 0

  // Next milestone calculation
  const MILESTONES = [
    { days: 7, xp: 100, label: '1 semaine', emoji: '🔥' },
    { days: 14, xp: 200, label: '2 semaines', emoji: '💪' },
    { days: 30, xp: 500, label: '1 mois', emoji: '🏆' },
    { days: 100, xp: 1000, label: '100 jours', emoji: '👑' },
  ]
  const nextMilestone = useMemo(() => {
    const next = MILESTONES.find(m => m.days > streakDays)
    if (next) {
      return { ...next, daysRemaining: next.days - streakDays, progress: (streakDays / next.days) * 100 }
    }
    const nextSeven = Math.ceil((streakDays + 1) / 7) * 7
    return { days: nextSeven, xp: 50, label: `${nextSeven} jours`, emoji: '⭐', daysRemaining: nextSeven - streakDays, progress: ((streakDays % 7) / 7) * 100 }
  }, [streakDays])

  // Last 7 days
  const last7Days = useMemo(() => {
    const days = []
    const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dow = d.getDay()
      days.push({
        label: labels[dow === 0 ? 6 : dow - 1],
        isActive: i < streakDays,
        isToday: i === 0,
      })
    }
    return days
  }, [streakDays])

  return (
    <>
      {/* Activité - Streak compact */}
      <section className="mb-5" aria-label="Activité">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-warning" />
          <h3 className="text-base font-semibold text-text-primary uppercase tracking-wide">
            Activité
          </h3>
        </div>
        <Card className="p-4">
          {/* Streak count */}
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              className="w-12 h-12 rounded-xl bg-warning/12 flex items-center justify-center"
              animate={streakDays >= 7 ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-2xl">🔥</span>
            </motion.div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-text-primary">{streakDays}</span>
                <span className="text-sm text-text-tertiary">{streakDays <= 1 ? 'jour' : 'jours'}</span>
              </div>
              <p className="text-xs text-text-quaternary">Série en cours</p>
            </div>
            {streakDays > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/12">
                <Zap className="w-3 h-3 text-success" />
                <span className="text-xs font-medium text-success">Actif</span>
              </div>
            )}
          </div>

          {/* Next milestone progress */}
          <div className="p-3 rounded-xl bg-surface-card mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gift className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-text-tertiary">Prochain palier</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-text-primary">{nextMilestone.emoji} {nextMilestone.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/12 text-success">+{nextMilestone.xp} XP</span>
              </div>
            </div>
            <div className="relative h-1.5 bg-border-subtle rounded-full overflow-hidden">
              <motion.div
                className="absolute h-full rounded-full bg-gradient-to-r from-warning to-warning/70"
                initial={{ width: 0 }}
                animate={{ width: `${nextMilestone.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-[10px] text-text-quaternary mt-1 text-right">
              Encore {nextMilestone.daysRemaining} jour{nextMilestone.daysRemaining > 1 ? 's' : ''}
            </p>
          </div>

          {/* Mini 7-day calendar */}
          <div className="flex gap-2 justify-between">
            {last7Days.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-text-quaternary">{day.label}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  day.isToday ? 'ring-1.5 ring-warning ring-offset-1 ring-offset-bg-base' : ''
                } ${day.isActive ? 'bg-warning/20' : 'bg-surface-card'}`}>
                  {day.isActive ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-border-subtle" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* IA Coach - Basique (gratuit) */}
      <div className="coach-ia-card-wrapper mb-5">
        <Card className={`p-4 bg-bg-elevated border ${style.border} relative overflow-hidden`}>
          <div className="flex items-start gap-3">
            {/* Sparkle icon with animation */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 15, -15, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: 'easeInOut',
                }}
              >
                <Sparkles className={`w-5 h-5 ${style.iconColor}`} />
              </motion.div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-md font-semibold text-text-primary">Coach IA</h3>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={style.badgeLabel}
                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${style.badgeBg}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {style.badgeLabel}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Tip content */}
              {hasRealTip ? (
                <p className={`text-base leading-relaxed ${style.textColor}`}>
                  {aiCoachTip!.tip}
                </p>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tipIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className={`text-base leading-relaxed ${style.textColor}`}>
                      {typedText}
                      {isTyping && (
                        <span className="inline-block w-0.5 h-4 bg-purple ml-0.5 align-middle animate-pulse" />
                      )}
                    </p>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Tip progress dots (only for rotating dynamic tips) */}
              {!hasRealTip && tipPool.length > 1 && (
                <div className="flex items-center gap-1.5 mt-3">
                  {tipPool.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTipIndex(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        i === tipIndex % tipPool.length
                          ? 'bg-purple w-4'
                          : 'bg-purple/30 hover:bg-purple/50'
                      }`}
                      aria-label={`Conseil ${i + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Action buttons */}
              {!hasRealTip && (
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    className="bg-purple hover:bg-purple/80 text-white text-xs gap-1.5"
                    onClick={() => navigate('/sessions')}
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    Planifier une session
                  </Button>
                  <button
                    onClick={() => {
                      const statsEl = document.querySelector('[aria-label="Statistiques"]')
                      if (statsEl) statsEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                    className="text-xs text-purple hover:text-purple/80 transition-colors flex items-center gap-1 px-2 py-1.5"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Voir mes stats
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

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
