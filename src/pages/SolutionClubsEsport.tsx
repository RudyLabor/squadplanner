import { Link } from 'react-router'
import { m } from 'framer-motion'
import { ArrowRight, Check, Users, BarChart3, Palette, Webhook } from '../components/icons'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'

const painPoints = [
  {
    title: 'Trop de squads à gérer',
    description:
      "Entre les équipes ranked, les remplaçants et les tryouts, tu passes plus de temps à organiser qu'à jouer.",
  },
  {
    title: 'Joueurs qui ghostent',
    description:
      "Les scrims annulés à la dernière minute parce que 2 joueurs ne se pointent pas. Sans prévenir.",
  },
  {
    title: "Pas de visibilité sur l'engagement",
    description:
      "Qui est vraiment investi ? Qui décroche ? Impossible de savoir sans tout tracker à la main.",
  },
]

const features = [
  {
    icon: Users,
    title: 'Dashboard multi-squads',
    description:
      "Vue d'ensemble de toutes tes équipes. Présences, sessions, activité — tout au même endroit.",
  },
  {
    icon: BarChart3,
    title: 'Analytics cross-squad',
    description:
      'Heatmaps de présences, score de fiabilité par joueur, tendances sur 30/60/90 jours. Export CSV.',
  },
  {
    icon: Palette,
    title: 'Branding personnalisé',
    description:
      "Logo, couleurs, nom du club. Tes joueurs voient ton identité, pas celle d'un outil générique.",
  },
  {
    icon: Webhook,
    title: 'API & Webhooks',
    description:
      "Connecte Squad Planner à ton Discord, ton site web ou tes outils internes. Automatise l'admin.",
  },
]

export default function SolutionClubsEsport() {
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
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge-shimmer border border-primary/25 mb-8">
              <span className="text-base font-medium text-primary">Club Esport</span>
            </div>
          </m.div>

          <m.h1
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-text-primary mb-6 leading-tight tracking-tight"
          >
            La solution pour les <span className="text-gradient-animated">clubs esport</span>
          </m.h1>
          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Gère tes équipes, suis l'engagement de tes joueurs et professionnalise ton club. Tout en un seul outil.
          </m.p>
          <m.div
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="inline-flex">
              <Link
                to="/contact"
                className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary-bg text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow"
              >
                Contacter l'équipe
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
          </m.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Pain Points */}
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
              On connaît tes galères
            </h2>
            <p className="text-text-tertiary text-lg">
              Gérer un club esport, c'est un taf à plein temps. On simplifie tout.
            </p>
          </m.div>
          <div className="grid md:grid-cols-3 gap-6">
            {painPoints.map((point, i) => (
              <m.div
                key={point.title}
                variants={scrollRevealLight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-surface-card border border-border-subtle"
              >
                <h3 className="text-lg font-bold text-text-primary mb-2">{point.title}</h3>
                <p className="text-text-secondary leading-relaxed">{point.description}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Features */}
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
              Tout ce qu'il faut pour grandir
            </h2>
          </m.div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => {
              const FeatureIcon = feature.icon
              return (
                <m.div
                  key={feature.title}
                  variants={scrollRevealLight}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-surface-card to-transparent border border-border-subtle hover:border-border-hover transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--color-primary-10)' }}
                    >
                      <FeatureIcon className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary mb-2">{feature.title}</h3>
                      <p className="text-text-secondary leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </m.div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Pricing */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl border border-border-subtle bg-surface-card text-center"
          >
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Offre Club
            </h2>
            <div className="flex items-baseline justify-center gap-1 mb-4">
              <span className="text-4xl font-extrabold text-text-primary">39,99</span>
              <span className="text-xl text-text-tertiary">/mois</span>
            </div>
            <p className="text-text-tertiary mb-6">
              ou 399,90/an (2 mois offerts) - Facturation entreprise disponible
            </p>
            <ul className="text-left max-w-sm mx-auto space-y-3 mb-8">
              {[
                'Squads et membres illimités',
                'Dashboard multi-squads',
                'Analytics avancées + export CSV',
                'Branding personnalisé',
                'API & Webhooks',
                'Support prioritaire',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-success flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="inline-flex">
              <Link
                to="/contact"
                className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary-bg text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow"
              >
                Contacter l'équipe
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
          </m.div>
        </div>
      </section>
    </PublicPageShell>
  )
}
