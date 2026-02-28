import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Check, ArrowRight, ChevronDown, Sparkles } from '../components/icons'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'
import { useState, useEffect } from 'react'

const features = [
  { category: 'Organisation', name: "Calendrier d'événements", guilded: true, squadPlanner: true },
  { category: 'Organisation', name: 'Événements récurrents', guilded: false, squadPlanner: true },
  { category: 'Organisation', name: 'Rappels automatiques', guilded: false, squadPlanner: true },
  { category: 'Organisation', name: 'Confirmation avec fiabilité', guilded: true, squadPlanner: true },
  { category: 'Communauté', name: 'Groupes/Squads', guilded: true, squadPlanner: true },
  { category: 'Communauté', name: 'Messages & Chat', guilded: true, squadPlanner: true },
  { category: 'Communauté', name: 'Party Vocale', guilded: false, squadPlanner: true },
  { category: 'Communauté', name: 'Profils Gaming', guilded: false, squadPlanner: true },
  { category: 'Fiabilité', name: 'Notifications Push', guilded: false, squadPlanner: true },
  { category: 'Fiabilité', name: 'Historique de présence', guilded: false, squadPlanner: true },
  { category: 'Analytics', name: 'Statistiques de présence', guilded: false, squadPlanner: true },
  { category: 'Analytics', name: 'Taux de présence', guilded: false, squadPlanner: true },
  { category: 'Analytics', name: 'Insights par joueur', guilded: false, squadPlanner: true },
]

const faqs = [
  {
    id: 'why-not-guilded',
    question: 'Pourquoi pas rester sur Guilded ?',
    answer:
      "Guilded a fermé, point final. Squad Planner, c'est taillé pour tes sessions : récurrence, notif push, stats de fiabilité. Guilded, c'était juste une commu. On gère l'organisation gaming. C'est plus rapide, plus réactif.",
  },
  {
    id: 'migration-easy',
    question: 'Je peux importer mes données ?',
    answer:
      "Oui. Si t'as tes squads documentés, on te facilite le move. Support direct pour une migration sans galère.",
  },
  {
    id: 'premium-worth',
    question: "C'est quoi Premium ?",
    answer:
      "Premium, c'est : analytics avancées, custom squads, API. Mais calendrier, confirmations, notif push ? Gratuit. L'essentiel, c'est gratuit.",
  },
  {
    id: 'both-platforms',
    question: 'Je peux utiliser Squad Planner ET Discord ?',
    answer:
      'Oui. Discord = pour parler. Squad Planner = pour organiser. Les notifs arrivent dans Discord. Tout est branché. Combo parfait.',
  },
  {
    id: 'other-games',
    question: 'Ça marche pour tous les jeux ?',
    answer:
      "Oui. Valorant, CS2, Apex, Fortnite, Dota 2, les petits jeux obscurs. Squad Planner gère tout. Compatible avec tous les jeux.",
  },
  {
    id: 'data-safety',
    question: 'Mais Squad Planner fermera aussi un jour ?',
    answer:
      "Squad Planner est là pour durer. Tu peux exporter tes données à tout moment — tu n'es jamais piégé.",
  },
]

function VsGuildedCountdown() {
  const [daysLeft, setDaysLeft] = useState(0)
  useEffect(() => {
    const expiry = new Date('2026-06-30T23:59:59')
    const now = new Date()
    const diff = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    setDaysLeft(diff)
  }, [])
  if (daysLeft <= 0) return null
  return (
    <p className="text-sm text-warning font-medium mb-6">
      ⏳ Code GUILDED30 expire le 30 juin 2026 — encore {daysLeft} jour{daysLeft > 1 ? 's' : ''}
    </p>
  )
}

export default function VsGuildedVsSquadPlanner() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  return (
    <PublicPageShell>
      {/* Hero */}
      <section className="relative overflow-hidden noise-overlay">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 0%, var(--color-primary-10) 0%, transparent 60%)',
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
                Comparatif détaillé · Le meilleur choix en 2026
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
            le match final
          </m.h1>

          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Guilded a fermé. Squad Planner est l'alternative gaming que tu attendais. Tous les
            détails, tous les chiffres.
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
                className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary-bg text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow w-full sm:w-auto justify-center"
              >
                Commencer maintenant
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="w-full sm:w-auto">
              <Link
                to="/alternative/guilded"
                className="flex items-center gap-2 h-14 px-8 rounded-xl border border-border-hover text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-all w-full sm:w-auto justify-center"
              >
                Alternative à Guilded
              </Link>
            </m.div>
          </m.div>
          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-base text-success font-medium mt-4"
          >
            +2 000 gamers ont déjà fait le switch
          </m.p>
          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-base text-text-quaternary mt-2"
          >
            100% gratuit · Pas de carte bancaire · Prêt en 30 secondes
          </m.p>
        </div>
      </section>

      <div className="section-divider" />

      {/* Feature Table */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Guilded vs Squad Planner : comparaison complète
            </h2>
            <p className="text-text-tertiary text-lg">Tous les détails, sans filtre</p>
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
                    <th className="px-6 py-4 text-left font-semibold text-text-primary">
                      Fonctionnalité
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-text-secondary">
                      Guilded
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-primary">
                      Squad Planner
                    </th>
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
                          <div className="text-xs text-text-tertiary mt-1 font-medium uppercase tracking-wider">
                            {feature.category}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {feature.guilded ? (
                          <Check className="w-6 h-6 text-success mx-auto" />
                        ) : (
                          <div className="w-6 h-6 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {feature.squadPlanner ? (
                          <Check className="w-6 h-6 text-success mx-auto" />
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
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Prix : Guilded vs Squad Planner
            </h2>
            <p className="text-text-tertiary text-lg">Ce que ça coûte vraiment</p>
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
                  <p className="text-text-secondary text-base">Forum, chat, voix</p>
                </div>
                <div>
                  <div className="font-semibold text-text-primary mb-2">Guilded Premium</div>
                  <p className="text-text-secondary text-base">~4,99 $/mois (prix US estimé)</p>
                  <p className="text-text-tertiary text-sm mt-1">*(supprimé depuis fermeture)</p>
                </div>
              </div>
              <p className="text-sm text-error font-semibold">
                Fermée depuis 2024. Plus rien ne bouge.
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
              <div className="absolute -top-3 -right-3 px-3 py-1 bg-primary-bg text-white text-xs font-semibold rounded-full">
                Le choix évident
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-6">Squad Planner</h3>
              <div className="space-y-4 mb-8">
                <div>
                  <div className="font-semibold text-text-primary mb-2">Gratuit</div>
                  <ul className="text-text-secondary text-base space-y-1">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <span>1 squad, 5 membres, 2 sessions/semaine — tout ça gratuit</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <span>Confirmation fiable</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <span>Notifications push</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-text-primary mb-2">Premium</div>
                  <p className="text-text-secondary text-base">6,99 €/mois ou 69,90 €/an</p>
                  <ul className="text-text-secondary text-sm mt-2 space-y-1 pl-4">
                    <li>• Analytics avancées</li>
                    <li>• Personnalisation squad</li>
                    <li>• API intégrations</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-success font-semibold">
                ✓ Active · On innove · On reste
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
              background: 'radial-gradient(ellipse at center, var(--color-primary-10) 0%, transparent 60%)',
              borderColor: 'var(--color-primary-20)',
            }}
          >
            <m.div
              className="absolute inset-0"
              animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: 'radial-gradient(ellipse at center, var(--color-primary-10) 0%, transparent 60%)',
              }}
            />
            <div className="relative z-10">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-primary fill-primary" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-4">Le verdict</h3>
              <p className="text-text-secondary mb-6 leading-relaxed text-lg">
                Guilded a fermé. Squad Planner, c'est l'orga gaming complète : calendrier, chat,
                party vocale. Ça complète Discord. C'est le choix logique pour tes sessions.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-text-primary">T'es venu de Guilded ?</strong>
                    <p className="text-text-secondary mt-1">
                      Squad Planner c'est ton move. Migration simple, fonctionnalités meilleures.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-text-primary">T'utilises Discord ?</strong>
                    <p className="text-text-secondary mt-1">
                      Ajoute Squad Planner pour l'orga. Les deux se parlent. Parfait ensemble.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-text-primary">T'es en squad compétitive ?</strong>
                    <p className="text-text-secondary mt-1">
                      Squad Planner te donne les stats et la fiabilité. Guilded n'avait pas ça.
                    </p>
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
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Les questions qu'on te pose tout le temps
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
                  <span className="text-base font-medium text-text-primary pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-text-quaternary shrink-0 transition-transform duration-300 ${openFAQ === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className={`faq-answer ${openFAQ === i ? 'open' : ''}`}>
                  <div>
                    <p className="px-5 pb-5 text-base text-text-tertiary leading-relaxed">
                      {faq.answer}
                    </p>
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
              background: 'radial-gradient(ellipse at center, var(--color-primary-10) 0%, transparent 60%)',
              borderColor: 'var(--color-primary-20)',
            }}
          >
            <m.div
              className="absolute inset-0"
              animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: 'radial-gradient(ellipse at center, var(--color-primary-10) 0%, transparent 60%)',
              }}
            />
            <div className="relative z-10">
              <m.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-12 h-12 mx-auto mb-6" style={{ color: 'var(--color-primary)' }} />
              </m.div>
              <h2 className="text-xl md:text-3xl font-bold text-text-primary mb-4">
                C'est bon, tu viens ?
              </h2>
              <p className="text-text-tertiary mb-4 text-lg">
                Code GUILDED30 = 30&nbsp;% sur Premium. Mais calendrier et confirmations, c'est gratuit de toute façon.
              </p>
              <VsGuildedCountdown />
              <m.div whileHover={{ scale: 1.03, y: -3 }} {...springTap} className="inline-flex">
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="flex items-center gap-2 h-16 px-10 rounded-xl bg-gradient-to-r from-primary to-purple text-white text-xl font-bold mx-auto shadow-lg shadow-primary/20 cta-glow-idle"
                >
                  C'est parti
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
