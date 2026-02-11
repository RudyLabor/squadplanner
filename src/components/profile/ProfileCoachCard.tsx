import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { m, AnimatePresence } from 'framer-motion'
import { Sparkles, CalendarPlus, BarChart3 } from 'lucide-react'
import { Card, Button } from '../ui'

// --- Dynamic Tips Engine ---

interface DynamicTip {
  text: string
  badge: string
}

function buildTipPool(streakDays: number, reliability: number): DynamicTip[] {
  const tips: DynamicTip[] = []

  if (streakDays > 0) {
    tips.push({ text: `Ta série de ${streakDays} jour${streakDays > 1 ? 's' : ''} est impressionnante ! Continue comme ça pour débloquer le prochain palier.`, badge: 'STREAK' })
  }
  if (streakDays >= 7) {
    tips.push({ text: `${streakDays} jours d'affilée ! Tu fais partie du top 10% des joueurs les plus réguliers.`, badge: 'ELITE' })
  }
  if (reliability >= 90) {
    tips.push({ text: 'Score de fiabilité excellent ! Ta squad peut compter sur toi.', badge: 'BRAVO' })
  } else if (reliability >= 70 && reliability < 90) {
    tips.push({ text: `${Math.round(reliability)}% de fiabilité, c'est solide. Quelques sessions confirmées de plus et tu passes au niveau supérieur !`, badge: 'CONSEIL' })
  } else if (reliability < 70) {
    tips.push({ text: 'Ton score de fiabilité peut s\'améliorer. Confirme tes prochaines sessions pour le booster !', badge: 'ATTENTION' })
  }

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
      if (i >= text.length) { clearInterval(interval); setIsTyping(false) }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return { displayed, isTyping }
}

// --- Style helper ---

function getCoachStyle(hasRealTip: boolean, aiCoachTone?: string, tipBadge?: string) {
  if (hasRealTip) {
    if (aiCoachTone === 'celebration') return { border: 'border-success', gradient: 'from-success-5', bg: 'bg-success-15', iconColor: 'text-success', textColor: 'text-success', badgeBg: 'bg-success-15 text-success', badgeLabel: 'BRAVO' }
    if (aiCoachTone === 'warning') return { border: 'border-error', gradient: 'from-error-5', bg: 'bg-error-10', iconColor: 'text-error', textColor: 'text-error', badgeBg: 'bg-error-15 text-error', badgeLabel: 'ATTENTION' }
    return { border: 'border-purple', gradient: 'from-purple-10', bg: 'bg-purple-10', iconColor: 'text-purple', textColor: 'text-text-primary', badgeBg: 'bg-purple-15 text-purple', badgeLabel: 'CONSEIL' }
  }

  if (tipBadge === 'BRAVO' || tipBadge === 'ELITE' || tipBadge === 'STREAK') {
    return { border: 'border-success', gradient: 'from-success-5', bg: 'bg-success-15', iconColor: 'text-success', textColor: 'text-success', badgeBg: 'bg-success-15 text-success', badgeLabel: tipBadge }
  }
  if (tipBadge === 'ATTENTION') {
    return { border: 'border-error', gradient: 'from-error-5', bg: 'bg-error-10', iconColor: 'text-error', textColor: 'text-error', badgeBg: 'bg-error-15 text-error', badgeLabel: tipBadge }
  }
  return { border: 'border-purple', gradient: 'from-purple-10', bg: 'bg-purple-10', iconColor: 'text-purple', textColor: 'text-text-primary', badgeBg: 'bg-purple-15 text-purple', badgeLabel: 'CONSEIL' }
}

interface ProfileCoachCardProps {
  streakDays: number
  reliabilityScore: number
  aiCoachTip?: { tip?: string; tone?: string } | null
}

export function ProfileCoachCard({ streakDays, reliabilityScore, aiCoachTip }: ProfileCoachCardProps) {
  const navigate = useNavigate()
  const [tipIndex, setTipIndex] = useState(0)

  const hasRealTip = !!(aiCoachTip?.tip)

  const tipPool = useMemo(
    () => buildTipPool(streakDays, reliabilityScore),
    [streakDays, reliabilityScore]
  )

  const currentTip = tipPool[tipIndex % tipPool.length]

  useEffect(() => {
    if (hasRealTip || tipPool.length <= 1) return
    const timer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % tipPool.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [hasRealTip, tipPool.length])

  const dynamicText = hasRealTip ? '' : currentTip?.text || ''
  const { displayed: typedText, isTyping } = useTypingEffect(dynamicText)

  const style = useCallback(() => getCoachStyle(hasRealTip, aiCoachTip?.tone, currentTip?.badge), [hasRealTip, aiCoachTip?.tone, currentTip?.badge])()

  return (
    <div className="coach-ia-card-wrapper mb-5">
      <Card className={`p-4 bg-bg-elevated border ${style.border} relative overflow-hidden`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
            <m.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
            >
              <Sparkles className={`w-5 h-5 ${style.iconColor}`} />
            </m.div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-md font-semibold text-text-primary">Coach IA</h3>
              <AnimatePresence mode="wait">
                <m.span
                  key={style.badgeLabel}
                  className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${style.badgeBg}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  {style.badgeLabel}
                </m.span>
              </AnimatePresence>
            </div>

            {hasRealTip ? (
              <p className={`text-base leading-relaxed ${style.textColor}`}>{aiCoachTip!.tip}</p>
            ) : (
              <AnimatePresence mode="wait">
                <m.div key={tipIndex} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
                  <p className={`text-base leading-relaxed ${style.textColor}`}>
                    {typedText}
                    {isTyping && <span className="inline-block w-0.5 h-4 bg-purple ml-0.5 align-middle animate-pulse" />}
                  </p>
                </m.div>
              </AnimatePresence>
            )}

            {!hasRealTip && tipPool.length > 1 && (
              <div className="flex items-center gap-1.5 mt-3">
                {tipPool.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTipIndex(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === tipIndex % tipPool.length ? 'bg-purple w-4' : 'bg-purple/30 hover:bg-purple/50'}`}
                    aria-label={`Conseil ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {!hasRealTip && (
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" className="bg-purple hover:bg-purple/80 text-white text-xs gap-1.5" onClick={() => navigate('/sessions')}>
                  <CalendarPlus className="w-3.5 h-3.5" />
                  Planifier une session
                </Button>
                <button
                  onClick={() => { const el = document.querySelector('[aria-label="Statistiques"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}
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
  )
}
