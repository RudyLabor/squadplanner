'use client'

import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Check, X, ArrowRight, Star } from '../components/icons'
import { useState } from 'react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

export default function VsGuildedVsSquadPlanner() {
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null)

  const features = [
    { category: 'Organisation', name: 'Calendrier d\'événements', guilded: true, squadPlanner: true },
    { category: 'Organisation', name: 'Événements récurrents', guilded: false, squadPlanner: true },
    { category: 'Organisation', name: 'Rappels automatiques', guilded: false, squadPlanner: true },
    { category: 'Organisation', name: 'RSVP avec fiabilité', guilded: true, squadPlanner: true },
    { category: 'Communauté', name: 'Groupes/Squads', guilded: true, squadPlanner: true },
    { category: 'Communauté', name: 'Messages & Chat', guilded: true, squadPlanner: false },
    { category: 'Communauté', name: 'Profils Gaming', guilded: false, squadPlanner: true },
    { category: 'Fiabilité', name: 'Notifications Push', guilded: false, squadPlanner: true },
    { category: 'Fiabilité', name: 'Historique de présence', guilded: false, squadPlanner: true },
    { category: 'Analytics', name: 'Statistiques RSVP', guilded: false, squadPlanner: true },
    { category: 'Analytics', name: 'Taux de présence', guilded: false, squadPlanner: true },
    { category: 'Analytics', name: 'Insights par joueur', guilded: false, squadPlanner: true }
  ]

  const faqs = [
    {
      id: 'why-not-guilded',
      question: 'Guilded avait déjà une communauté. Pourquoi Squad Planner ?',
      answer: 'Guilded était une super plateforme de communication. Mais il manquait les outils spécifiques pour les sessions gaming : récurrence, notifications push, statistiques de fiabilité, etc. Squad Planner est plus léger, plus rapide, et 100% focalisé sur l\'organisation gaming. Utilise Discord pour l\'ambiance, Squad Planner pour l\'organisation.'
    },
    {
      id: 'migration-easy',
      question: 'Est-ce qu\'on peut importer nos données Guilded ?',
      answer: 'Squad Planner offre un processus d\'import simplifié. Si tu as tes squads et événements documentés, on peut t\'aider à les importer. Contacte notre support pour une migration personnalisée.'
    },
    {
      id: 'premium-worth',
      question: 'C\'est quoi, Squad Planner Premium ?',
      answer: 'Premium déverrouille : analytics avancées, personnalisation des squads, API pour intégrations personnalisées, et priorité support. Mais le calendrier, les RSVP, et les notifications restent gratuits. C\'est l\'essentiel qui est libre.'
    },
    {
      id: 'both-platforms',
      question: 'Peut-on utiliser Squad Planner ET Discord en même temps ?',
      answer: 'Oui, évidemment ! Squad Planner s\'intègre avec Discord. Utilise Discord pour l\'ambiance et la commu, Squad Planner pour organiser les sessions. Les notifications viennent à toi dans Discord, mais l\'organisation est centralisée dans Squad Planner.'
    },
    {
      id: 'other-games',
      question: 'Squad Planner fonctionne pour tous les jeux ?',
      answer: 'Oui ! Que tu joues à Valorant, CS2, Apex, Fortnite, Dota 2, ou n\'importe quel autre jeu, Squad Planner gère tes sessions. C\'est agnostique du jeu, optimisé pour le gaming en général.'
    },
    {
      id: 'data-safety',
      question: 'Mais Guilded a fermé. Squad Planner fermera aussi ?',
      answer: 'Squad Planner est 100% viable et rentable. On a une roadmap long terme claire. Mais surtout, on fournit des exports de données à tout moment. Tu garderas toujours tes données. C\'est contractuel.'
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
              Guilded vs Squad Planner<span className="text-primary">:</span> Le comparatif complet
            </h1>
            <p className="text-xl text-text-secondary mb-8 max-w-2xl">
              Guilded a fermé. Squad Planner est l'alternative spécialisée dans l'organisation gaming. Voici comment on se compare.
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
                Migrer de Guilded
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/alternative-guilded"
                className="px-8 py-4 border border-border-subtle text-text-primary rounded-xl font-semibold hover:bg-surface-card transition-colors"
              >
                Alternative à Guilded
              </Link>
            </m.div>
          </m.div>
        </div>
      </section>

      {/* Feature-by-feature Table */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">
              Comparaison Détaillée des Fonctionnalités
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
                    <th className="px-6 py-4 text-center font-semibold text-text-secondary">Guilded</th>
                    <th className="px-6 py-4 text-center font-semibold text-primary">Squad Planner</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, idx) => (
                    <tr
                      key={`${feature.name}-${idx}`}
                      className={`${idx % 2 === 0 ? 'bg-bg-base' : 'bg-surface-card'} border-b border-border-subtle last:border-b-0`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-text-primary">{feature.name}</div>
                        {feature.category && (
                          <div className="text-xs text-text-tertiary mt-1 font-medium">{feature.category}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {feature.guilded ? (
                          <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-text-tertiary mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {feature.squadPlanner ? (
                          <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-text-tertiary mx-auto" />
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

      {/* Pricing Comparison */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">
              Tarification : Guilded vs Squad Planner
            </h2>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Guilded */}
            <div className="p-8 bg-surface-card rounded-2xl border border-border-subtle">
              <h3 className="text-2xl font-bold text-text-primary mb-6">Guilded</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <div className="font-semibold text-text-primary mb-1">Gratuit</div>
                  <p className="text-sm text-text-secondary">Forum, chat, voix</p>
                </div>
                <div>
                  <div className="font-semibold text-text-primary mb-1">Guilded Premium</div>
                  <p className="text-sm text-text-secondary">9,99$/mois (supprimé depuis fermeture)</p>
                </div>
              </div>
              <p className="text-sm text-text-tertiary">
                *Plateforme fermée depuis 2024. Plus de nouvelles mises à jour.
              </p>
            </div>

            {/* Squad Planner */}
            <div className="p-8 bg-surface-card rounded-2xl border border-primary/30 relative">
              <div className="absolute -top-3 -right-3 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                Mieux
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-6">Squad Planner</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <div className="font-semibold text-text-primary mb-1">Gratuit</div>
                  <p className="text-sm text-text-secondary">
                    Calendrier illimité, RSVP, notifications, squads
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-text-primary mb-1">Premium</div>
                  <p className="text-sm text-text-secondary">
                    5,99$/mois ou 59,99$/an
                  </p>
                  <ul className="text-xs text-text-secondary mt-2 space-y-1">
                    <li>Analytics avancées</li>
                    <li>Personnalisation squad</li>
                    <li>API intégrations</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-emerald-400 font-semibold">
                ✓ Plateforme active, roadmap à long terme
              </p>
            </div>
          </m.div>
        </div>
      </section>

      {/* Verdict */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl border border-primary/20"
          >
            <div className="flex gap-4 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-primary fill-primary" />
              ))}
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-4">Le Verdict</h3>
            <p className="text-text-secondary mb-6 leading-relaxed">
              Guilded était une excellente plateforme de communication gaming. Mais elle a fermé. Squad Planner est spécialisé dans l'organisation des sessions, pas le chat. C'est complémentaire à Discord (qui gère la commu) et meilleur que les alternatives pour organiser les sessions gaming.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-text-primary">
                  <strong>Pour les utilisateurs Guilded :</strong> Squad Planner est le meilleur remplacement. Migration facile, features supérieures.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-text-primary">
                  <strong>Pour ceux avec Discord :</strong> Ajoute Squad Planner pour l'organisation. Les deux services se complètent parfaitement.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-text-primary">
                  <strong>Pour les squads compétitives :</strong> Squad Planner offre les stats et la fiabilité que Guilded n'avait pas.
                </span>
              </div>
            </div>
          </m.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">
              Questions Fréquentes
            </h2>
          </m.div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <m.div
                key={faq.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <button
                  onClick={() =>
                    setExpandedFaqId(expandedFaqId === faq.id ? null : faq.id)
                  }
                  className="w-full text-left p-6 bg-surface-card rounded-xl border border-border-subtle hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {faq.question}
                    </h3>
                    <div className="flex-shrink-0">
                      <m.div
                        animate={{ rotate: expandedFaqId === faq.id ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <svg
                          className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                          />
                        </svg>
                      </m.div>
                    </div>
                  </div>
                  <m.div
                    initial={false}
                    animate={{
                      height: expandedFaqId === faq.id ? 'auto' : 0,
                      opacity: expandedFaqId === faq.id ? 1 : 0,
                      marginTop: expandedFaqId === faq.id ? 16 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </m.div>
                </button>
              </m.div>
            ))}
          </div>
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
              Prêt à migrer vers Squad Planner ?
            </h2>
            <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
              Utilise le code <strong>GUILDED30</strong> pour 30% sur ton premier mois Premium. Mais le calendrier et les RSVP, c'est gratuit.
            </p>
            <Link
              to="/auth"
              className="inline-flex px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors items-center gap-2"
            >
              Commencer maintenant
              <ArrowRight className="w-5 h-5" />
            </Link>
          </m.div>
        </div>
      </section>
    </div>
  )
}
