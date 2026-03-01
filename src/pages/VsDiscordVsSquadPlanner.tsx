import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Check, X, ArrowRight, ChevronDown } from '../components/icons'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'
import { useState, useEffect } from 'react'
import { trackEvent } from '../utils/analytics'

const features = [
  { category: 'Organisation', items: [
    { name: "Calendrier d'événements", discord: 'Limité', squadPlanner: true },
    { name: 'RSVP avec fiabilité', discord: false, squadPlanner: true },
    { name: 'Rappels automatiques', discord: false, squadPlanner: true },
    { name: 'Sessions récurrentes', discord: false, squadPlanner: true },
    { name: 'Auto-confirmation seuil', discord: false, squadPlanner: true },
  ]},
  { category: 'Communication', items: [
    { name: 'Chat texte', discord: true, squadPlanner: true },
    { name: 'Voice chat', discord: true, squadPlanner: true },
    { name: 'Partage GIF', discord: true, squadPlanner: true },
    { name: 'Mentions @user', discord: true, squadPlanner: true },
  ]},
  { category: 'Analytics', items: [
    { name: 'Score de fiabilité', discord: false, squadPlanner: true },
    { name: 'Heatmap présences', discord: false, squadPlanner: true },
    { name: 'Stats par joueur', discord: false, squadPlanner: true },
    { name: 'Dashboard analytics', discord: false, squadPlanner: true },
  ]},
  { category: 'Gamification', items: [
    { name: 'Système XP/niveaux', discord: false, squadPlanner: true },
    { name: 'Challenges quotidiens', discord: false, squadPlanner: true },
    { name: 'Badges & achievements', discord: false, squadPlanner: true },
    { name: 'Streaks de présence', discord: false, squadPlanner: true },
  ]},
]

const advantages = [
  {
    title: 'Organisation fiable',
    description:
      "Discord Events, c'est basique. Pas de confirmation fiable, pas de rappels, pas de récurrence. Squad Planner comble ce vide.",
  },
  {
    title: 'Données objectives',
    description:
      'Qui ghost ? Qui est fiable ? Discord ne te dit rien. Squad Planner calcule un score de fiabilité pour chaque joueur.',
  },
  {
    title: 'Combo parfait',
    description:
      'Garde Discord pour la commu. Utilise Squad Planner pour organiser. Les notifications arrivent dans les deux. Zéro friction.',
  },
]

const faqs = [
  {
    question: 'Je dois quitter Discord ?',
    answer:
      "Non ! Discord et Squad Planner sont complémentaires. Utilise Discord pour la commu, Squad Planner pour l'organisation. Les deux coexistent parfaitement.",
  },
  {
    question: 'Discord Events ne suffit pas ?',
    answer:
      "Discord Events est basique : pas de score de fiabilité, pas de rappels auto, pas de récurrence, pas d'analytics. Squad Planner fait tout ça en natif.",
  },
  {
    question: "C'est gratuit ?",
    answer:
      "Oui ! Le plan gratuit inclut 1 squad, 5 membres, calendrier, RSVP, chat et notifications. Premium débloque plus de squads et d'analytics à partir de 6,99 €/mois.",
  },
  {
    question: 'Mes données sont en sécurité ?',
    answer:
      'Oui. Hébergé sur Supabase (PostgreSQL), chiffrement en transit et au repos, conforme RGPD. Tu peux exporter ou supprimer tes données à tout moment.',
  },
  {
    question: 'Ça marche pour tous les jeux ?',
    answer:
      'Oui. Valorant, LoL, Fortnite, CS2, Apex, Rocket League, et tous les autres. Squad Planner est game-agnostic.',
  },
  {
    question: 'Comment intégrer Discord ?',
    answer:
      'Connecte ton compte Discord dans les paramètres. Les notifications Squad Planner arrivent directement dans ton Discord.',
  },
]

function CellIcon({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-6 h-6 text-success mx-auto" />
  if (value === false) return <X className="w-6 h-6 text-error mx-auto" />
  return <span className="text-sm text-warning font-medium">{value}</span>
}

export default function VsDiscordVsSquadPlanner() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  useEffect(() => { trackEvent('page_viewed', { page: 'vs_discord' }) }, [])

  const allItems = features.flatMap((g) => g.items.map((item) => ({ ...item, category: g.category })))

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
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge-shimmer border border-purple/25 mb-8">
              <span className="text-base font-medium text-purple">Comparatif détaillé 2026</span>
            </div>
          </m.div>

          <m.h1
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-text-primary mb-6 leading-tight tracking-tight"
          >
            Discord vs Squad Planner<span className="text-gradient-animated"> :</span>
            <br />
            le match
          </m.h1>

          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Discord gère la communication. Squad Planner gère l'organisation gaming. Les deux sont
            complémentaires.
          </m.p>

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
                Essayer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
          </m.div>
          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-base text-text-quaternary mt-4"
          >
            100% gratuit · Pas de carte bancaire · Prêt en 30 secondes
          </m.p>
        </div>
      </section>

      <div className="section-divider" />

      {/* Feature Comparison Table */}
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
              Discord vs Squad Planner : comparaison complète
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
                    <th className="px-6 py-4 text-left font-semibold text-text-primary">Fonctionnalité</th>
                    <th className="px-6 py-4 text-center font-semibold text-text-secondary">Discord</th>
                    <th className="px-6 py-4 text-center font-semibold text-primary">Squad Planner</th>
                  </tr>
                </thead>
                <tbody>
                  {allItems.map((feature, idx) => (
                    <tr
                      key={`${feature.name}-${idx}`}
                      className={`${idx % 2 === 0 ? 'bg-bg-base' : 'bg-surface-card'} border-b border-border-subtle last:border-b-0`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-text-primary">{feature.name}</div>
                        <div className="text-xs text-text-tertiary mt-1 font-medium uppercase tracking-wider">
                          {feature.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CellIcon value={feature.discord} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CellIcon value={feature.squadPlanner} />
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

      {/* Why Squad Planner + Discord */}
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
              Pourquoi Squad Planner en plus de Discord ?
            </h2>
            <p className="text-text-tertiary text-lg">
              Discord fait le chat. Squad Planner fait l'organisation.
            </p>
          </m.div>

          <div className="grid md:grid-cols-3 gap-6">
            {advantages.map((adv, i) => (
              <m.div
                key={adv.title}
                variants={scrollRevealLight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-gradient-to-br from-surface-card to-transparent border border-border-subtle"
              >
                <h3 className="text-lg font-bold text-text-primary mb-3">{adv.title}</h3>
                <p className="text-text-secondary text-base leading-relaxed">{adv.description}</p>
              </m.div>
            ))}
          </div>
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
                  <span className="text-base font-medium text-text-primary pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-text-quaternary shrink-0 transition-transform duration-300 ${openFAQ === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className={`faq-answer ${openFAQ === i ? 'open' : ''}`}>
                  <div>
                    <p className="px-5 pb-5 text-base text-text-tertiary leading-relaxed">{faq.answer}</p>
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
                background:
                  'radial-gradient(ellipse at center, var(--color-primary-10) 0%, transparent 60%)',
              }}
            />
            <div className="relative z-10">
              <h2 className="text-xl md:text-3xl font-bold text-text-primary mb-4">
                Essaie Squad Planner gratuitement
              </h2>
              <p className="text-text-tertiary mb-8 text-lg">
                Garde Discord pour la commu. Ajoute Squad Planner pour l'organisation. Le combo
                gagnant.
              </p>
              <m.div whileHover={{ scale: 1.03, y: -3 }} {...springTap} className="inline-flex">
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary-bg text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow"
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
