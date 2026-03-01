import { Link } from 'react-router'
import { m } from 'framer-motion'
import { ArrowRight, Check, Flame, Sparkles, Star, Trophy } from '../components/icons'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'

const features = [
  {
    icon: Sparkles,
    title: 'Système XP & Niveaux',
    desc: "Gagne de l'XP à chaque session, RSVP et check-in. Monte de niveau et débloque de nouveaux titres.",
  },
  {
    icon: Star,
    title: 'Challenges quotidiens & hebdo',
    desc: 'Des défis renouvelés chaque jour et chaque semaine. Participe, complète, récolte les récompenses.',
  },
  {
    icon: Flame,
    title: 'Streaks de présence',
    desc: 'Joue régulièrement pour maintenir ton streak. Chaque semaine complète booste ton XP.',
  },
  {
    icon: Trophy,
    title: 'Badges & Achievements',
    desc: 'Débloque des badges rares en atteignant des paliers. Affiche-les sur ton profil public.',
  },
]

const benefits = [
  { text: 'Plus de motivation pour se connecter chaque session' },
  { text: 'Compétition saine entre membres de la squad' },
  { text: 'Profil riche avec badges et progression visible' },
  { text: 'Récompenses pour la régularité, pas que le skill' },
]

export default function FeatureGamification() {
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge-shimmer border border-primary/25 mb-8">
              <Trophy className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              <span className="text-base font-medium text-primary">Feature</span>
            </div>
          </m.div>

          <m.h1
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-text-primary mb-6 leading-tight tracking-tight"
          >
            XP, Challenges & Streaks
          </m.h1>

          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Transforme chaque session en progression. Gagne de l'XP, relève des défis et grimpe dans le classement.
          </m.p>

          <m.div variants={scrollRevealLight} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="inline-flex">
              <Link
                to="/auth?mode=register&redirect=onboarding"
                className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary-bg text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow"
              >
                Commencer à gagner de l'XP
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
          </m.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Features grid */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">Tout pour rester motivé</h2>
            <p className="text-text-tertiary text-lg">Un système de progression complet, taillé pour les gamers.</p>
          </m.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <m.div
                  key={f.title}
                  variants={scrollRevealLight}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-surface-card to-transparent border border-border-subtle hover:border-border-hover transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--color-primary-10)' }}
                    >
                      <Icon className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary mb-2">{f.title}</h3>
                      <p className="text-text-tertiary text-base leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </m.div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Benefits */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">Pourquoi ta squad va adorer</h2>
          </m.div>

          <div className="space-y-4">
            {benefits.map((b, i) => (
              <m.div
                key={i}
                variants={scrollRevealLight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 p-4 rounded-xl border border-border-subtle"
              >
                <Check className="w-5 h-5 text-success flex-shrink-0" />
                <span className="text-text-primary text-base">{b.text}</span>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* CTA */}
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
            <div className="relative z-10">
              <h2 className="text-xl md:text-3xl font-bold text-text-primary mb-4">Prêt à monter de niveau ?</h2>
              <p className="text-text-tertiary mb-8 text-lg">Crée ton compte et commence à gagner de l'XP dès ta première session.</p>
              <m.div whileHover={{ scale: 1.03, y: -3 }} {...springTap} className="inline-flex">
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary-bg text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow"
                >
                  Monte de niveau
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </m.div>
              <p className="text-base text-text-quaternary mt-4">100% gratuit &middot; Pas de carte bancaire</p>
            </div>
          </m.div>
        </div>
      </section>
    </PublicPageShell>
  )
}
