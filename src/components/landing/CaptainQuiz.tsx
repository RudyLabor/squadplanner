import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router'
import { ArrowRight, Sparkles } from '../icons'

const QUESTIONS = [
  {
    question: 'Comment tu organises tes sessions ?',
    options: [
      { label: 'Je planifie tout une semaine à l\'avance', type: 'stratege' },
      { label: 'Je motive mes potes au dernier moment', type: 'motivateur' },
      { label: 'Je m\'adapte au planning de chacun', type: 'flexible' },
      { label: 'On joue tous les soirs, point final', type: 'hardcore' },
    ],
  },
  {
    question: 'Quand ta squad ghost, tu...',
    options: [
      { label: 'Je réorganise immédiatement avec d\'autres', type: 'stratege' },
      { label: 'J\'envoie un message pour remotiver', type: 'motivateur' },
      { label: 'Pas grave, je joue solo ou j\'attends', type: 'flexible' },
      { label: 'Je note qui a ghosté et je m\'en souviens', type: 'hardcore' },
    ],
  },
  {
    question: 'Ton créneau préféré ?',
    options: [
      { label: 'Soirées planifiées (20h-23h)', type: 'stratege' },
      { label: 'Quand tout le monde est chaud', type: 'motivateur' },
      { label: 'N\'importe quand, je suis dispo', type: 'flexible' },
      { label: 'Tous les jours, sessions longues', type: 'hardcore' },
    ],
  },
  {
    question: 'Combien de potes dans ta squad idéale ?',
    options: [
      { label: '5 joueurs fixes, pas un de plus', type: 'stratege' },
      { label: '10+, plus on est de fous...', type: 'motivateur' },
      { label: 'Ça dépend du jeu', type: 'flexible' },
      { label: '3-4 joueurs sérieux qui grindent', type: 'hardcore' },
    ],
  },
]

const PROFILES = {
  stratege: {
    name: 'Le Stratège',
    emoji: '🧠',
    desc: 'Tu planifies tout. Ta squad ne joue jamais dans le flou. Tu es le cerveau de l\'équipe.',
    tip: 'Avec Squad Planner, automatise tes sessions récurrentes et ne rate plus jamais un créneau.',
  },
  motivateur: {
    name: 'Le Motivateur',
    emoji: '🔥',
    desc: 'Tu es le ciment de la squad. Sans toi, personne ne se connecte. Tu motives les troupes.',
    tip: 'Squad Planner envoie les rappels à ta place. Toi, tu te concentres sur l\'ambiance.',
  },
  flexible: {
    name: 'Le Flexible',
    emoji: '🎯',
    desc: 'Tu t\'adaptes à tout. Horaire, jeu, rôle — peu importe, tu es toujours partant.',
    tip: 'Avec le matchmaking, trouve des joueurs aussi flexibles que toi en quelques secondes.',
  },
  hardcore: {
    name: 'Le Hardcore',
    emoji: '⚔️',
    desc: 'Jouer c\'est ton mode de vie. Tu grind tous les jours et tu attends la même chose de ta squad.',
    tip: 'Le score de fiabilité élimine les casuals. Ne joue qu\'avec des joueurs aussi investis que toi.',
  },
} as const

type ProfileType = keyof typeof PROFILES

export function CaptainQuiz() {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<ProfileType[]>([])
  const [result, setResult] = useState<ProfileType | null>(null)

  const handleAnswer = (type: ProfileType) => {
    const newAnswers = [...answers, type]
    setAnswers(newAnswers)

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      // Calculate result — most frequent type
      const counts: Record<string, number> = {}
      newAnswers.forEach((a) => { counts[a] = (counts[a] || 0) + 1 })
      const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as ProfileType
      setResult(winner)
    }
  }

  const reset = () => {
    setCurrentQ(0)
    setAnswers([])
    setResult(null)
  }

  const profile = result ? PROFILES[result] : null

  return (
    <section className="px-4 md:px-6 py-10 md:py-14">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
            Quel type de capitaine es-tu ?
          </h2>
          <p className="text-text-tertiary">
            4 questions, 30 secondes — découvre ton profil de leader
          </p>
        </div>

        <div className="p-4 md:p-6 rounded-2xl bg-surface-card border border-border-subtle">
          <AnimatePresence mode="wait">
            {!result ? (
              <m.div
                key={`q-${currentQ}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Progress */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 h-1.5 rounded-full bg-border-subtle overflow-hidden">
                    <m.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: `${(currentQ / QUESTIONS.length) * 100}%` }}
                      animate={{ width: `${((currentQ + 1) / QUESTIONS.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-xs text-text-quaternary font-medium">
                    {currentQ + 1}/{QUESTIONS.length}
                  </span>
                </div>

                <h3 className="text-sm md:text-base font-semibold text-text-primary mb-4">
                  {QUESTIONS[currentQ].question}
                </h3>

                <div className="space-y-2">
                  {QUESTIONS[currentQ].options.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleAnswer(opt.type as ProfileType)}
                      className="w-full text-left px-3 py-2.5 md:p-3 rounded-xl border border-border-subtle hover:border-primary/40 hover:bg-primary/[0.04] text-xs md:text-sm text-text-secondary hover:text-text-primary transition-all break-words"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </m.div>
            ) : (
              <m.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <m.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="text-5xl mb-3"
                >
                  {profile?.emoji}
                </m.div>
                <h3 className="text-lg font-bold text-text-primary mb-1">{profile?.name}</h3>
                <p className="text-sm text-text-tertiary mb-4">{profile?.desc}</p>
                <div className="p-3 rounded-xl bg-primary/[0.06] border border-primary/15 mb-5">
                  <div className="flex items-center gap-2 justify-center mb-1">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">Conseil Squad Planner</span>
                  </div>
                  <p className="text-sm text-text-secondary">{profile?.tip}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={reset}
                    className="flex-1 h-10 rounded-xl border border-border-subtle text-sm text-text-tertiary hover:text-text-primary hover:border-border-hover transition-colors"
                  >
                    Recommencer
                  </button>
                  <Link
                    to="/auth?mode=register&redirect=onboarding"
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-primary-bg text-white text-sm font-semibold hover:bg-primary-bg-hover transition-colors"
                  >
                    Créer ma squad
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
