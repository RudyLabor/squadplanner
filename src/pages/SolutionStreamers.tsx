import { useEffect } from 'react'
import { trackEvent } from '../utils/analytics'
import { Link } from 'react-router'
import { m } from 'framer-motion'
import { ArrowRight, Check, Calendar, ShieldCheck, Monitor, Megaphone } from '../components/icons'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'

const painPoints = [
  {
    title: 'Organiser les games avec ta commu',
    description:
      "Tu lances un \"qui veut jouer ?\" sur Discord et tu reçois 47 réponses. Impossible de savoir qui sera vraiment là.",
  },
  {
    title: 'Savoir qui est fiable',
    description:
      "Certains disent \"présent\" et ne viennent jamais. D'autres sont toujours là mais tu ne le sais pas.",
  },
  {
    title: 'Garder ta commu engagée',
    description:
      "Entre les streams, les VODs et la vie perso, ta communauté se disperse. Difficile de maintenir l'engagement.",
  },
]

const features = [
  {
    icon: Calendar,
    title: 'Sessions planifiées',
    description:
      "Crée des sessions récurrentes pour tes soirées communautaires. Chaque semaine, même heure, même crew. Tes viewers savent quand se connecter.",
  },
  {
    icon: ShieldCheck,
    title: 'RSVP fiable',
    description:
      "Score de fiabilité par joueur. Tu sais exactement qui viendra et qui ghost. Plus de sessions annulées à la dernière minute.",
  },
  {
    icon: Monitor,
    title: 'Widget embeddable',
    description:
      "Affiche ton planning de sessions directement sur ton stream ou ta page Twitch. Tes viewers s'inscrivent en un clic.",
  },
  {
    icon: Megaphone,
    title: 'Programme ambassadeur',
    description:
      "20% de commission sur chaque abonnement Premium. Squad Leader lifetime offert. Rejoins le programme et monétise ta communauté.",
  },
]

export default function SolutionStreamers() {
  useEffect(() => { trackEvent('page_viewed', { page: 'solution_streamers' }) }, [])

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
              <span className="text-base font-medium text-primary">Streamers & Créateurs</span>
            </div>
          </m.div>

          <m.h1
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-text-primary mb-6 leading-tight tracking-tight"
          >
            La solution pour les <span className="text-gradient-animated">streamers</span>
          </m.h1>
          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Organise tes sessions avec ta communauté. Sache qui est fiable. Garde tes viewers engagés entre les streams.
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
                to="/ambassador"
                className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary-bg text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow w-full sm:w-auto justify-center"
              >
                Devenir ambassadeur
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="w-full sm:w-auto">
              <Link
                to="/auth?mode=register&redirect=onboarding"
                className="flex items-center gap-2 h-14 px-8 rounded-xl border border-border-hover text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-all w-full sm:w-auto justify-center"
              >
                Essayer gratuitement
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
              On sait ce que c'est
            </h2>
            <p className="text-text-tertiary text-lg">
              Gérer une communauté gaming, c'est plus que juste streamer.
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
              Des outils taillés pour les créateurs
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

      {/* Ambassador CTA */}
      <section className="px-4 md:px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative p-8 md:p-12 rounded-3xl border overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at center, var(--color-primary-10) 0%, transparent 60%)',
              borderColor: 'var(--color-primary-20)',
            }}
          >
            <div className="relative z-10">
              <h2 className="text-xl md:text-3xl font-bold text-text-primary mb-4">
                Rejoins le programme ambassadeur
              </h2>
              <p className="text-text-tertiary mb-4 text-lg">
                20% de commission. Squad Leader lifetime offert.
              </p>
              <ul className="text-left max-w-xs mx-auto space-y-2 mb-8">
                {['Lien de parrainage personnalisé', 'Dashboard de suivi', 'Paiements mensuels'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2 text-text-secondary text-sm">
                      <Check className="w-4 h-4 text-success flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ),
                )}
              </ul>
              <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="inline-flex">
                <Link
                  to="/ambassador"
                  className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary-bg text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow"
                >
                  Devenir ambassadeur
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </m.div>
            </div>
          </m.div>
        </div>
      </section>
    </PublicPageShell>
  )
}
