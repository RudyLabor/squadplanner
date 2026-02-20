import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Check, ArrowRight, Users, Sparkles, Zap } from '../components/icons'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'

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
    description: 'Squad Planner est 100% orienté gaming. Chaque fonctionnalité résout un problème réel des sessions.',
    icon: Sparkles
  },
  {
    title: 'Fiabilité Garantie',
    description: 'Notifications push et rappels RSVP intégrés. Plus de no-shows. Les sessions se font sans surprise.',
    icon: Check
  },
  {
    title: 'Équipe Réactive',
    description: 'Nos développeurs sont des gamers. Nous écoutons et déployons les features rapidement, sans waiting list.',
    icon: Zap
  }
]

export default function AlternativeGamerLink() {
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
                Mieux que GamerLink · Plus rapide & plus gaming
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
            Une meilleure alternative
            <br />
            à GamerLink<span className="text-gradient-animated">.</span>
          </m.h1>

          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Plus rapide, plus fiable, plus gaming. Squad Planner est conçu spécifiquement pour les squads et les sessions compétitives, avec tous les outils que tu as.
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
                Rejoindre Squad Planner
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="w-full sm:w-auto">
              <Link
                to="/discover"
                className="flex items-center gap-2 h-14 px-8 rounded-xl border border-border-hover text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-all w-full sm:w-auto justify-center"
              >
                Explorer les squads
              </Link>
            </m.div>
          </m.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Comparison Table */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Comparaison Squad Planner vs GamerLink
            </h2>
            <p className="text-text-tertiary text-lg">
              Point par point, fonctionnalité par fonctionnalité
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
                    <th className="px-6 py-4 text-center font-semibold text-primary">Squad Planner</th>
                    <th className="px-6 py-4 text-center font-semibold text-text-secondary">GamerLink</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, idx) => (
                    <tr
                      key={feature.name}
                      className={`${idx % 2 === 0 ? 'bg-bg-base' : 'bg-surface-card'} border-b border-border-subtle last:border-b-0`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-text-primary">{feature.name}</div>
                        <div className="text-sm text-text-tertiary mt-1">{feature.description}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {feature.squadPlanner ? (
                          <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {feature.gamerLink ? (
                          <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                        ) : null}
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

      {/* Advantages */}
      <section className="px-4 md:px-6 py-12 md:py-16 bg-gradient-to-b from-transparent to-primary/[0.015]">
        <div className="max-w-5xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Pourquoi changer pour Squad Planner ?
            </h2>
            <p className="text-text-tertiary text-lg">
              Trois raisons fondamentales qui font la différence
            </p>
          </m.div>

          <div className="grid md:grid-cols-3 gap-6">
            {advantages.map((advantage, i) => {
              const Icon = advantage.icon
              return (
                <m.div
                  key={advantage.title}
                  variants={scrollRevealLight}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-surface-card to-transparent border border-border-subtle hover:border-border-hover transition-all group"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: '#a855f712' }}
                  >
                    <Icon className="w-6 h-6" style={{ color: '#a855f7' }} />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">{advantage.title}</h3>
                  <p className="text-md text-text-tertiary">{advantage.description}</p>
                </m.div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Trust Section */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-surface-card/80 to-transparent border border-border-subtle hover:border-border-hover transition-all"
          >
            <div className="flex flex-col items-center text-center">
              <div className="flex justify-center gap-2 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-6 h-6 text-primary fill-primary" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
                Rejoins 10 000+ gamers
              </h3>
              <p className="text-text-tertiary mb-8 max-w-2xl">
                Chaque jour, des squads organisent leurs sessions sur Squad Planner. Zéro abonnement obligatoire. Zéro prise de tête. Juste du gaming.
              </p>
              <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap}>
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/10 hover:bg-primary/90 transition-colors"
                >
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </m.div>
            </div>
          </m.div>
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
                Prêt à passer à Squad Planner ?
              </h2>
              <p className="text-text-tertiary mb-8 text-lg">
                Migrer depuis GamerLink prend 5 minutes. Tes squads, tes événements, tout est conservé.
              </p>
              <m.div whileHover={{ scale: 1.03, y: -3 }} {...springTap} className="inline-flex">
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="flex items-center gap-2 h-16 px-10 rounded-xl bg-gradient-to-r from-primary to-purple text-white text-xl font-bold mx-auto shadow-lg shadow-primary/20 cta-glow-idle"
                >
                  Rejoins gratuitement
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </m.div>
              <p className="text-base text-text-quaternary mt-4">
                Gratuit · Pas de carte bancaire · 5 minutes
              </p>
            </div>
          </m.div>
        </div>
      </section>
    </PublicPageShell>
  )
}
