import { useState, useEffect, useCallback } from 'react'
import { m, AnimatePresence } from 'framer-motion'

const NOTIFICATION_TEMPLATES = [
  { text: (n: string) => `${n} vient de créer une squad`, icon: '🎮' },
  { text: (_: string) => 'Une session vient d\'être confirmée', icon: '✅' },
  { text: (n: string) => `${n} a atteint 95% de fiabilité`, icon: '🏆' },
  { text: (_: string) => '3 sessions planifiées dans la dernière heure', icon: '📅' },
  { text: (n: string) => `${n} a rejoint une squad Valorant`, icon: '🎯' },
  { text: (_: string) => '12 joueurs en ligne maintenant', icon: '🟢' },
  { text: (n: string) => `${n} a réclamé le badge "Stratège"`, icon: '🏅' },
  { text: (_: string) => '5 squads créées aujourd\'hui', icon: '🚀' },
]

const RANDOM_NAMES = [
  'Alex', 'Marie', 'Lucas', 'Emma', 'Théo', 'Léa', 'Hugo', 'Chloé',
  'Nathan', 'Jade', 'Raphaël', 'Sarah', 'Tom', 'Lina', 'Maxime', 'Zoé',
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function SocialProofNotification() {
  const [notification, setNotification] = useState<{ text: string; icon: string } | null>(null)
  const [visible, setVisible] = useState(false)

  const showNotification = useCallback(() => {
    const template = pickRandom(NOTIFICATION_TEMPLATES)
    const name = pickRandom(RANDOM_NAMES)
    setNotification({ text: template.text(name), icon: template.icon })
    setVisible(true)
    // Auto-hide after 4s
    setTimeout(() => setVisible(false), 4000)
  }, [])

  useEffect(() => {
    // First notification after 15-30s
    const initialDelay = 15000 + Math.random() * 15000
    const initialTimer = setTimeout(() => {
      showNotification()
    }, initialDelay)

    // Subsequent every 30-60s
    const interval = setInterval(() => {
      showNotification()
    }, 30000 + Math.random() * 30000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [showNotification])

  return (
    <div className="fixed bottom-4 left-4 z-40 pointer-events-none" aria-live="polite">
      <AnimatePresence>
        {visible && notification && (
          <m.div
            initial={{ opacity: 0, y: 20, x: -10 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-elevated/95 backdrop-blur-sm border border-border-subtle shadow-lg max-w-xs"
          >
            <span className="text-lg flex-shrink-0">{notification.icon}</span>
            <div>
              <p className="text-sm text-text-primary font-medium">{notification.text}</p>
              <p className="text-xs text-text-quaternary">il y a quelques secondes</p>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
