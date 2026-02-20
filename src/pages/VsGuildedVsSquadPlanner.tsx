import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Check, ArrowRight, ChevronDown, Sparkles } from '../components/icons'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'
import { useState } from 'react'

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
    answer: 'Guilded était une excellente plateforme de communication. Mais il manquait les outils spécifiques pour les sessions gaming : récurrence, notifications push, statistiques de fiabilité. Squad Planner est léger, rapide, et 100% focalisé sur l\'organisation gaming. Utilise Discord pour l\'ambiance, Squad Planner pour organiser.'
  },
  {
    id: 'migration-easy',
    question: 'Est-ce qu\'on peut importer nos données Guilded ?',
    answer: 'Squad Planner offre un processus d\'import simplifié. Si tu as tes squads et événements documentés, on peut t\'aider. Contacte notre support pour une migration personnalisée.'
  },
  {
    id: 'premium-worth',
    question: 'C\'est quoi, Squad Planner Premium ?',
    answer: 'Premium déverrouille : analytics avancées, personnalisation des squads, API pour intégrations personnalisées, et priorité support. Mais le calendrier, les RSVP, et les notifications restent gratuits. C\'est l\'essentiel qui est libre.'
  },
  {
    id: 'both-platforms',
    question: 'Peut-on utiliser Squad Planner ET Discord en même temps ?',
    answer: 'Oui ! Squad Planner s\'intègre avec Discord. Utilise Discord pour l\'ambiance et la commu, Squad Planner pour organiser les sessions. Les notifications viennent dans Discord, mais l\'organisation est centralisée dans Squad Planner.'
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

export default function VsGuildedVsSquadPlanner() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  return (
    <PublicPageShell>
      {/* Hero */}
      <section className="relative overflow-hidden noise-overlay">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 0%, #a855f712 0%, transparent 60%)',
            filter: 'blur(40px)',
          }}
        />
        <div className="relative px-4 md:px-6 py-16 md:py-24 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge-shimmer border border-purple/25 mb-8">
              <span className="text-base font-medium text-purple">
                Comparatif complet · Le meilleur remplacement
              </span>
            </div>
          </m.div>

          {/* Title */}
          <m.h1
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-text-primary mb-6 leading-tight tracking-tight"
          >
            Guilded vs Squad Planner<span className="text-gradient-animated">:</span>
            <br />
            Le comparatif complet
          </m.h1>

          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Guilded a fermé. Squad Planner est l'alternative spécialisée dans l'organisation gaming. Voici comment on se compare point par point.
          </m.p>

          {/* CTAs */}
          <m.div
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="w-full sm:w-auto">
              <Link
                to="/auth?mode=register&redirect=onboarding"
                className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow w-full sm:w-auto justify-center"
              >
                Migrer de Guilded
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="w-full sm:w-auto">
              <Link
                to="/alternative-guilded"
                className="flex items-center gap-2 h-14 px-8 rounded-xl border border-border-hover text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-all w-full sm:w-auto justify-center"
              >
                Alternative à Guilded
              </Link>
            </m.div>
          </m.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Feature Table */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Comparaison détaillée des fonctionnalités
            </h2>
            <p className="text-text-tertiary text-lg">
              12 catégories, 100% transparence
            </p>
          </m.div>

          <m.div
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
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
                          <div className="text-xs text-text-tertiary mt-1 font-medium uppercase tracking-wider">{feature.category}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {feature.guilded ? (
                          <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                        ) : (
                          <div className="w-6 h-6 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {feature.squadPlanner ? (
                          <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                        ) : (
                          <div className="w-6 h-6 mx-auto" />
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

      <div className="section-divider" />

      {/* Pricing */}
      <section className="px-4 md:px-6 py-12 md:py-16 bg-gradient-to-b from-transparent to-purple/[0.015]">
        <div className="max-w-5xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Tarification : Guilded vs Squad Planner
            </h2>
            <p className="text-text-tertiary text-lg">
              Compare les modèles de pricing
            </p>
          </m.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Guilded */}
            <m.div
              variants={scrollRevealLight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="p-8 md:p-10 rounded-2xl bg-gradient-to-br from-surface-card to-transparent border border-border-subtle"
            >
              <h3 className="text-2xl font-bold text-text-primary mb-6">Guilded</h3>
              <div className="space-y-4 mb-8">
                <div>
                  <div className="font-semibold text-text-primary mb-2">Gratuit</div>
                  <p className="text-text-secondary text-md">Forum, chat, voix</p>
                </div>
                <div>
                  <div className="font-semibold text-text-primary mb-2">Guilded Premium</div>
                  <p className="text-text-secondary text-md">9,99 $/mois</p>
                  <p className="text-text-tertiary text-sm mt-1">*(supprimé depuis fermeture)</p>
                </div>
              </div>
              <p className="text-sm text-red-500 font-semibold">
                Plateforme fermée depuis 2024 · Pas de mises à jour
              </p>
            </m.div>

            {/* Squad Planner */}
            <m.div
              variants={scrollRevealLight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-8 md:p-10 rounded-2xl bg-gradient-to-br from-surface-card to-transparent border border-primary/30 relative"
            >
              <div className="absolute -top-3 -right-3 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                Meilleur choix
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-6">Squad Planner</h3>
              <div className="space-y-4 mb-8">
                <div>
                  <div className="font-semibold text-text-primary mb-2">Gratuit</div>
                  <ul className="text-text-secondary text-md space-y-1">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Calendrier illimité</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>RSVP fiable</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Notifications push</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-text-primary mb-2">Premium</div>
                  <p className="text-text-secondary text-md">5,99 $/mois ou 59,99 $/an</p>
                  <ul className="text-text-secondary text-sm mt-2 space-y-1 pl-4">
                    <li>• Analytics avancées</li>
                    <li>• Personnalisation squad</li>
                    <li>• API intégrations</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-emerald-400 font-semibold">
                ✓ Plateforme active · Roadmap long terme · Viable
              </p>
            </m.div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Verdict */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative p-8 md:p-10 rounded-3xl border overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at center, #a855f710 0%, transparent 60%)',
              borderColor: '#a855f720',
            }}
          >
            <m.div
              className="absolute inset-0"
              animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ background: 'radial-gradient(ellipse at center, #a855f708 0%, transparent 60%)' }}
            />
            <div className="relative z-10">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-primary fill-primary" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-4">Le Verdict</h3>
              <p className="text-text-secondary mb-6 leading-relaxed text-lg">
                Guilded était une excellente plateforme de communication gaming. Mais elle a fermé. Squad Planner est spécialisé dans l'organisation des sessions, pas le chat. C'est complémentaire à Discord (qui gère la commu) et meilleur que toutes les alternatives pour organiser les sessions gaming.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-text-primary">Pour les utilisateurs Guilded :</strong>
                    <p className="text-text-secondary mt-1">Squad Planner est le meilleur remplacement. Migration facile, features supérieures.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-text-primary">Pour ceux avec Discord :</strong>
                    <p className="text-text-secondary mt-1">Ajoute Squad Planner pour l'organisation. Les deux services se complètent parfaitement.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-text-primary">Pour les squads compétitives :</strong>
                    <p className="text-text-secondary mt-1">Squad Planner offre les stats et la fiabilité que Guilded n'avait pas.</p>
                  </div>
                </div>
              </div>
            </div>
          </m.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* FAQ */}
      <section className="px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-3xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Questions fréquentes
            </h2>
          </m.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <m.div
                key={i}
                variants={scrollRevealLight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="border border-border-subtle rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-bg-elevated/50 transition-colors"
                  aria-expanded={openFAQ === i}
                >
                  <span className="text-md font-medium text-text-primary pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-text-quaternary shrink-0 transition-transform duration-300 ${openFAQ === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className={`faq-answer ${openFAQ === i ? 'open' : ''}`}>
                  <div>
                    <p className="px-5 pb-5 text-md text-text-tertiary leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Final CTA */}
      <section className="px-4 md:px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative p-8 md:p-12 rounded-3xl border text-center overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at center, #a855f710 0%, transparent 60%)',
              borderColor: '#a855f720',
            }}
          >
            <m.div
              className="absolute inset-0"
              animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ background: 'radial-gradient(ellipse at center, #a855f708 0%, transparent 60%)' }}
            />
            <div className="relative z-10">
              <m.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-12 h-12 mx-auto mb-6" style={{ color: '#a855f7' }} />
              </m.div>
              <h2 className="text-xl md:text-3xl font-bold text-text-primary mb-4">
                Prêt à migrer vers Squad Planner ?
              </h2>
              <p className="text-text-tertiary mb-8 text-lg">
                Code GUILDED30 pour 30% sur ton premier mois Premium. Mais le calendrier et les RSVP, c'est gratuit.
              </p>
              <m.div whileHover={{ scale: 1.03, y: -3 }} {...springTap} className="inline-flex">
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="flex items-center gap-2 h-16 px-10 rounded-xl bg-gradient-to-r from-primary to-purple text-white text-xl font-bold mx-auto shadow-lg shadow-primary/20 cta-glow-idle"
                >
                  Commencer maintenant
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </m.div>
              <p className="text-base text-text-quaternary mt-4">
                Gratuit · Pas de carte bancaire · 30 secondes
              </p>
            </div>
          </m.div>
        </div>
      </section>
    </PublicPageShell>
  )
}
