import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Check, ArrowRight, Users, Sparkles, Zap } from '../components/icons'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'

const comparisonFeatures = [
  {
    name: 'Trouve des joueurs',
    squadPlanner: true,
    gamerLink: true,
    description: 'Des partenaires de ton niveau',
  },
  {
    name: 'Calendrier des sessions',
    squadPlanner: true,
    gamerLink: false,
    description: 'Planifie et répète automatiquement',
  },
  {
    name: 'Confirmation fiable',
    squadPlanner: true,
    gamerLink: false,
    description: 'Score de fiabilité intégré',
  },
  {
    name: 'Notifs push immédiates',
    squadPlanner: true,
    gamerLink: false,
    description: 'Rappels automatiques',
  },
  {
    name: 'Sessions récurrentes',
    squadPlanner: true,
    gamerLink: false,
    description: 'Crée une fois, ça se répète',
  },
  {
    name: 'Score de fiabilité',
    squadPlanner: true,
    gamerLink: false,
    description: 'Vois qui est régulier',
  },
  {
    name: 'Analytics gaming',
    squadPlanner: true,
    gamerLink: false,
    description: 'Stats de présence et tendances',
  },
  {
    name: 'Chat intégré',
    squadPlanner: true,
    gamerLink: false,
    description: 'Messagerie de squad intégrée',
  },
  {
    name: 'Party vocale',
    squadPlanner: true,
    gamerLink: false,
    description: 'Appels vocaux gaming en un clic',
  },
  {
    name: "Gratuit pour l'essentiel",
    squadPlanner: true,
    gamerLink: true,
    description: 'Les bases sans payer',
  },
]

const advantages = [
  {
    title: 'Conçu pour les gamers',
    description:
      "Squad Planner, c'est 100% pour toi. Chaque fonctionnalité est là pour régler un vrai problème de session.",
    icon: Sparkles,
  },
  {
    title: 'Confirmation qui tient',
    description:
      'Notifs push, rappels 1h avant. Ceux qui disent oui viennent vraiment. Plus de no-shows.',
    icon: Check,
  },
  {
    title: 'Une équipe de gamers',
    description:
      "On est des joueurs, comme toi. Tu demandes un truc, on le fait. Pas de file d'attente, pas de blabla.",
    icon: Zap,
  },
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
                Oublie GamerLink · Passe à Squad Planner
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
            L'alternative à GamerLink
            <br />
            que tu attendais<span className="text-gradient-animated">.</span>
          </m.h1>

          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Plus rapide. Plus fiable. Plus gaming. Squad Planner, c'est conçu pour toi, ta squad,
            tes sessions. Pas de jargon. Juste l'essentiel.
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
                Essayer maintenant
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="w-full sm:w-auto">
              <a
                href="#comparison"
                className="flex items-center gap-2 h-14 px-8 rounded-xl border border-border-hover text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-all w-full sm:w-auto justify-center"
              >
                Voir la comparaison
              </a>
            </m.div>
          </m.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Comparison Table */}
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
              Squad Planner vs GamerLink : le vrai match
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
                    <th className="px-6 py-4 text-center font-semibold text-primary">
                      Squad Planner
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-text-secondary">
                      GamerLink
                    </th>
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
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Pourquoi tu vas te régaler sur Squad Planner
            </h2>
            <p className="text-text-tertiary text-lg">Trois raisons qui changent tout</p>
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
                Déjà +2 000 gamers avant toi
              </h3>
              <p className="text-text-tertiary mb-8 max-w-2xl">
                Chaque jour, des squads lancent leurs sessions ici. Zéro frais. Zéro prise de tête.
                Juste du vrai gaming.
              </p>
              <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap}>
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-primary-bg text-white rounded-xl font-semibold shadow-lg shadow-primary/10 hover:bg-primary-bg-hover transition-colors"
                >
                  Créer mon compte
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
              style={{
                background: 'radial-gradient(ellipse at center, #a855f708 0%, transparent 60%)',
              }}
            />
            <div className="relative z-10">
              <m.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-12 h-12 mx-auto mb-6" style={{ color: '#a855f7' }} />
              </m.div>
              <h2 className="text-xl md:text-3xl font-bold text-text-primary mb-4">
                T'as pris ta décision ?
              </h2>
              <p className="text-text-tertiary mb-8 text-lg">
                Créer ta squad sur Squad Planner, c'est 30 secondes. Tes potes te rejoignent via un code. Simple.
              </p>
              <m.div whileHover={{ scale: 1.03, y: -3 }} {...springTap} className="inline-flex">
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="flex items-center gap-2 h-16 px-10 rounded-xl bg-gradient-to-r from-primary to-purple text-white text-xl font-bold mx-auto shadow-lg shadow-primary/20 cta-glow-idle"
                >
                  Migrer maintenant
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
