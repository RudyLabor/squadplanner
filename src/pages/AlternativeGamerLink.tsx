'use client'

import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Check, X, ArrowRight, Calendar, Users, Sparkles, Star } from '../components/icons'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const containerVariants = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2
    }
  }
}

export default function AlternativeGamerLink() {
  const comparisonFeatures = [
    { name: 'Matchmaking Avancé', squadPlanner: true, gamerLink: true, description: 'Trouver des partenaires compatibles' },
    { name: 'Calendrier des Sessions', squadPlanner: true, gamerLink: false, description: 'Planifier & récurrence' },
    { name: 'RSVP Fiable', squadPlanner: true, gamerLink: false, description: 'Confirmations & reminders' },
    { name: 'Notifications Temps Réel', squadPlanner: true, gamerLink: false, description: 'Alertes instantanées' },
    { name: 'Analytics Gaming', squadPlanner: true, gamerLink: false, description: 'Statistiques & insights' },
    { name: 'Gratuit pour l\'essentiel', squadPlanner: true, gamerLink: false, description: 'Sans paiement obligatoire' }
  ]

  const advantages = [
    {
      title: 'Conçu pour les Gamers',
      description: 'Squad Planner est 100% orienté gaming. Chaque fonctionnalité est pensée pour les sessions, compétitions et communautés de joueurs.',
      icon: Sparkles
    },
    {
      title: 'Fiabilité Garantie',
      description: 'Les notifications push et les rappels RSVP sont intégrés. Plus d\'excuses pour les no-shows. Les sessions se font sans surprise.',
      icon: Check
    },
    {
      title: 'Équipe Réactive',
      description: 'Nos développeurs sont des gamers. Nous écoutons et déployons des features rapidement. Pas de waiting list, juste de la vitesse.',
      icon: Users
    }
  ]

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6 leading-tight">
              Une meilleure alternative à GamerLink<span className="text-primary">.</span>
            </h1>
            <p className="text-xl text-text-secondary mb-8 max-w-2xl">
              Plus rapide, plus fiable, plus gaming. Squad Planner est conçu spécifiquement pour les squads et les sessions compétitives.
            </p>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex gap-4 flex-wrap"
            >
              <Link
                to="/auth"
                className="px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                Rejoindre Squad Planner
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/discover"
                className="px-8 py-4 border border-border-subtle text-text-primary rounded-xl font-semibold hover:bg-surface-card transition-colors"
              >
                Explorer les squads
              </Link>
            </m.div>
          </m.div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">
              Comparaison Squad Planner vs GamerLink
            </h2>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="overflow-hidden rounded-2xl border border-border-subtle"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-card border-b border-border-subtle">
                    <th className="px-6 py-4 text-left font-semibold text-text-primary">Fonctionnalité</th>
                    <th className="px-6 py-4 text-center font-semibold text-primary">Squad Planner</th>
                    <th className="px-6 py-4 text-center font-semibold text-text-secondary">GamerLink</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, idx) => (
                    <tr
                      key={feature.name}
                      className={idx % 2 === 0 ? 'bg-bg-base' : 'bg-surface-card'}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-text-primary">{feature.name}</div>
                        <div className="text-sm text-text-tertiary mt-1">{feature.description}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {feature.squadPlanner ? (
                          <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-red-400 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {feature.gamerLink ? (
                          <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-red-400 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </m.div>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">
              Pourquoi changer pour Squad Planner ?
            </h2>
          </m.div>

          <m.div
            variants={containerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {advantages.map((advantage) => {
              const Icon = advantage.icon
              return (
                <m.div
                  key={advantage.title}
                  variants={fadeInUp}
                  className="p-6 bg-surface-card rounded-2xl border border-border-subtle hover:border-primary/50 transition-colors"
                >
                  <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-3">{advantage.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{advantage.description}</p>
                </m.div>
              )
            })}
          </m.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 bg-surface-card rounded-2xl border border-border-subtle text-center"
          >
            <div className="flex justify-center gap-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-primary fill-primary" />
              ))}
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-3">
              Rejoins 10 000+ gamers
            </h3>
            <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
              Chaque jour, des squads organisent leurs sessions sur Squad Planner. Zéro abonnement obligatoire. Zéro prise de tête. Juste du gaming.
            </p>
            <Link
              to="/auth"
              className="inline-flex px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors items-center gap-2"
            >
              Commencer gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
          </m.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-text-primary mb-6">
              Prêt à passer à Squad Planner ?
            </h2>
            <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
              Migrer depuis GamerLink prend 5 minutes. Tes squads, tes événements, tout est conservé.
            </p>
            <Link
              to="/auth"
              className="inline-flex px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors items-center gap-2"
            >
              Rejoins gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
          </m.div>
        </div>
      </section>
    </div>
  )
}
