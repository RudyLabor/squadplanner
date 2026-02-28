import { useState, useMemo } from 'react'
import { m } from 'framer-motion'
import { Link } from 'react-router'
import { ArrowRight } from '../icons'

export function GhostCalculator() {
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3)
  const [playersPerSession, setPlayersPerSession] = useState(5)
  const [ghostRate, setGhostRate] = useState(30)

  const stats = useMemo(() => {
    const avgSessionHours = 2
    const ghostedSessionsPerWeek = sessionsPerWeek * (ghostRate / 100)
    const hoursLostPerWeek = ghostedSessionsPerWeek * avgSessionHours
    const hoursLostPerMonth = hoursLostPerWeek * 4.3
    const totalPlayerHoursLost = hoursLostPerMonth * playersPerSession
    // With Squad Planner, assume ghost rate drops to ~10%
    const recoveredHours = hoursLostPerMonth * 0.65
    return {
      hoursLostPerMonth: Math.round(hoursLostPerMonth * 10) / 10,
      totalPlayerHoursLost: Math.round(totalPlayerHoursLost),
      recoveredHours: Math.round(recoveredHours * 10) / 10,
    }
  }, [sessionsPerWeek, playersPerSession, ghostRate])

  return (
    <section className="px-4 md:px-6 py-10 md:py-14">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-2">
            Combien d'heures ta squad perd au ghosting ?
          </h2>
          <p className="text-text-tertiary">
            Calcule le vrai coût des joueurs qui ne viennent pas
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle">
          {/* Sessions per week */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-secondary">
                Sessions par semaine
              </label>
              <span className="text-sm font-bold text-primary">{sessionsPerWeek}</span>
            </div>
            <input
              type="range"
              min={1}
              max={7}
              value={sessionsPerWeek}
              onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-border-subtle cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-text-quaternary mt-1">
              <span>1</span>
              <span>7</span>
            </div>
          </div>

          {/* Players per session */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-secondary">
                Joueurs par session
              </label>
              <span className="text-sm font-bold text-primary">{playersPerSession}</span>
            </div>
            <input
              type="range"
              min={2}
              max={10}
              value={playersPerSession}
              onChange={(e) => setPlayersPerSession(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-border-subtle cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-text-quaternary mt-1">
              <span>2</span>
              <span>10</span>
            </div>
          </div>

          {/* Ghost rate */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-secondary">
                Taux de ghosting moyen
              </label>
              <span className="text-sm font-bold text-error">{ghostRate}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={80}
              step={5}
              value={ghostRate}
              onChange={(e) => setGhostRate(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-border-subtle cursor-pointer accent-error"
            />
            <div className="flex justify-between text-xs text-text-quaternary mt-1">
              <span>10%</span>
              <span>80%</span>
            </div>
          </div>

          {/* Results */}
          <div className="p-4 rounded-xl bg-error/[0.05] border border-error/10 mb-4">
            <p className="text-sm text-text-tertiary mb-2">Ta squad perd chaque mois :</p>
            <m.p
              key={stats.hoursLostPerMonth}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-error"
            >
              {stats.hoursLostPerMonth}h de jeu
            </m.p>
            <p className="text-xs text-text-quaternary mt-1">
              Soit {stats.totalPlayerHoursLost} heures-joueurs perdues au total
            </p>
          </div>

          <div className="p-4 rounded-xl bg-success/[0.05] border border-success/10 mb-5">
            <p className="text-sm text-text-tertiary mb-1">Avec Squad Planner, tu récupères :</p>
            <m.p
              key={stats.recoveredHours}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-xl font-bold text-success"
            >
              +{stats.recoveredHours}h par mois
            </m.p>
            <p className="text-xs text-text-quaternary mt-1">
              Grâce aux confirmations et au score de fiabilité
            </p>
          </div>

          <Link
            to="/auth?mode=register&redirect=onboarding"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-primary-bg text-white font-semibold hover:bg-primary-bg-hover transition-colors"
          >
            Récupérer mes heures perdues
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-text-quaternary text-center mt-2">
            100% gratuit · Pas de carte bancaire
          </p>
        </div>
      </div>
    </section>
  )
}
