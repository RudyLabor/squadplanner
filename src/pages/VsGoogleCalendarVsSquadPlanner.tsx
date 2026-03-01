import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Check, X, ArrowRight, ChevronDown } from '../components/icons'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'
import { useState } from 'react'

const features = [
  { category: 'Planification', name: 'Événements récurrents', gcal: true, sp: true },
  { category: 'Planification', name: 'Invitations par email', gcal: true, sp: false },
  { category: 'Planification', name: 'RSVP basique', gcal: true, sp: true },
  { category: 'Planification', name: 'RSVP avec fiabilité', gcal: false, sp: true },
  { category: 'Planification', name: 'Rappels personnalisés', gcal: true, sp: true },
  { category: 'Planification', name: 'Fuseaux horaires', gcal: true, sp: true },
  { category: 'Gaming spécifique', name: 'Squads / équipes', gcal: false, sp: true },
  { category: 'Gaming spécifique', name: 'Chat intégré', gcal: false, sp: true },
  { category: 'Gaming spécifique', name: 'Voice chat', gcal: false, sp: true },
  { category: 'Gaming spécifique', name: 'Score de fiabilité', gcal: false, sp: true },
  { category: 'Gaming spécifique', name: 'Gamification XP', gcal: false, sp: true },
  { category: 'Gaming spécifique', name: 'Matchmaking', gcal: false, sp: true },
  { category: 'Analytics', name: 'Vue calendrier', gcal: true, sp: false },
  { category: 'Analytics', name: 'Heatmap de présence', gcal: false, sp: true },
  { category: 'Analytics', name: 'Taux de présence', gcal: false, sp: true },
  { category: 'Analytics', name: 'Tendances sessions', gcal: false, sp: true },
]

const arguments_ = [
  {
    title: 'Pas de fiabilité',
    desc: 'Google Calendar te dit qui accepte. Squad Planner te dit qui vient VRAIMENT, avec un score basé sur l\'historique.',
  },
  {
    title: 'Pas de contexte gaming',
    desc: 'Google Calendar ne sait pas ce qu\'est une squad, un RSVP fiable, un check-in ou une session récurrente gaming.',
  },
  {
    title: 'Pas de gamification',
    desc: 'Pas de XP, pas de challenges, pas de streaks. Google Calendar est un outil de productivité, pas un outil gaming.',
  },
]

const faqs = [
  {
    question: 'Je peux utiliser les deux ?',
    answer:
      'Oui. Squad Planner propose l\'export calendrier (Premium) pour synchroniser tes sessions dans Google Calendar. Le meilleur des deux mondes.',
  },
  {
    question: 'Google Calendar est gratuit, pourquoi payer ?',
    answer:
      'Squad Planner est aussi gratuit ! Le plan Free inclut 1 squad, 5 membres, calendrier, RSVP et notifications. Premium ajoute plus de squads et d\'analytics.',
  },
  {
    question: 'Squad Planner a un calendrier visuel ?',
    answer:
      'Pas de vue calendrier classique, mais un planning de sessions clair avec filtres, rappels et export vers Google Calendar.',
  },
  {
    question: 'C\'est adapté pour les grosses squads ?',
    answer:
      'Oui. Premium gère 20 membres, Squad Leader 50, Team 75, Club 100. Avec analytics par joueur et heatmaps de présence.',
  },
  {
    question: 'Mes données sont exportables ?',
    answer:
      'Oui. Export RGPD complet de tes données à tout moment. Tes sessions s\'exportent aussi en format calendrier standard.',
  },
]

export default function VsGoogleCalendarVsSquadPlanner() {
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
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge-shimmer border border-purple/25 mb-8">
              <span className="text-base font-medium text-purple">
                Comparatif 2026 · Gaming vs Généraliste
              </span>
            </div>
          </m.div>

          <m.h1
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-text-primary mb-6 leading-tight tracking-tight"
          >
            Google Calendar vs Squad Planner
          </m.h1>

          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Google Calendar est fait pour les réunions. Squad Planner est fait pour les sessions gaming.
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
                Essayer Squad Planner
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

      {/* Feature Table */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Google Calendar vs Squad Planner : comparaison complète
            </h2>
            <p className="text-text-tertiary text-lg">Fonctionnalité par fonctionnalité</p>
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
                    <th className="px-6 py-4 text-center font-semibold text-text-secondary">Google Calendar</th>
                    <th className="px-6 py-4 text-center font-semibold text-primary">Squad Planner</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((f, idx) => (
                    <tr
                      key={`${f.name}-${idx}`}
                      className={`${idx % 2 === 0 ? 'bg-bg-base' : 'bg-surface-card'} border-b border-border-subtle last:border-b-0`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-text-primary">{f.name}</div>
                        <div className="text-xs text-text-tertiary mt-1 font-medium uppercase tracking-wider">{f.category}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {f.gcal ? <Check className="w-6 h-6 text-success mx-auto" /> : <X className="w-6 h-6 text-text-quaternary mx-auto" />}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {f.sp ? <Check className="w-6 h-6 text-success mx-auto" /> : <X className="w-6 h-6 text-text-quaternary mx-auto" />}
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

      {/* Why not just Google Calendar */}
      <section className="px-4 md:px-6 py-12 md:py-16 bg-gradient-to-b from-transparent to-purple/[0.015]">
        <div className="max-w-5xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Pourquoi pas juste Google Calendar ?
            </h2>
            <p className="text-text-tertiary text-lg">3 raisons qui changent tout pour les gamers</p>
          </m.div>

          <div className="grid md:grid-cols-3 gap-6">
            {arguments_.map((arg, i) => (
              <m.div
                key={i}
                variants={scrollRevealLight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-gradient-to-br from-surface-card to-transparent border border-border-subtle"
              >
                <h3 className="text-lg font-bold text-text-primary mb-3">{arg.title}</h3>
                <p className="text-text-secondary text-base leading-relaxed">{arg.desc}</p>
              </m.div>
            ))}
          </div>
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
                background: 'radial-gradient(ellipse at center, var(--color-primary-10) 0%, transparent 60%)',
              }}
            />
            <div className="relative z-10">
              <h2 className="text-xl md:text-3xl font-bold text-text-primary mb-4">
                Prêt à organiser tes sessions comme un pro ?
              </h2>
              <p className="text-text-tertiary mb-6 text-lg">
                Google Calendar pour la vie. Squad Planner pour le gaming.
              </p>
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
