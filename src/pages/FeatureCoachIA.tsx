import { Link } from 'react-router'
import { m } from 'framer-motion'
import { ArrowRight, Check, Sparkles, Clock, Users } from '../components/icons'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'

const features = [
  {
    icon: Sparkles,
    title: 'Conseils personnalisés',
    desc: "L'IA analyse tes stats et te donne des tips adaptés à ton profil. Pas de conseils génériques.",
  },
  {
    icon: Clock,
    title: "Analyse d'habitudes",
    desc: 'Détecte tes patterns de jeu : quand tu joues le mieux, quand tu ghost, quand ta squad est au top.',
  },
  {
    icon: Users,
    title: 'Créneaux optimaux',
    desc: 'Identifie les meilleurs moments pour planifier tes sessions en fonction des dispos de ta squad.',
  },
]

const steps = [
  {
    num: '1',
    title: 'Joue normalement',
    desc: 'Le coach observe tes RSVP, check-ins et habitudes de session.',
  },
  {
    num: '2',
    title: 'Reçois des tips',
    desc: 'Des conseils personnalisés apparaissent sur ton dashboard, adaptés à ta situation.',
  },
  {
    num: '3',
    title: 'Progresse',
    desc: "Applique les recommandations et vois ta fiabilité et ton engagement s'améliorer.",
  },
]

export default function FeatureCoachIA() {
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
              <Sparkles className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              <span className="text-base font-medium text-primary">Feature Premium</span>
            </div>
          </m.div>

          <m.h1
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-text-primary mb-6 leading-tight tracking-tight"
          >
            Ton Coach IA Personnel
          </m.h1>

          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Un assistant intelligent qui analyse tes habitudes et te guide pour optimiser tes sessions de jeu et ta squad.
          </m.p>

          <m.div variants={scrollRevealLight} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="inline-flex">
              <Link
                to="/auth?mode=register&redirect=onboarding"
                className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary-bg text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow"
              >
                Découvrir le Coach IA
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
          </m.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Features */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">Un coach qui comprend ton jeu</h2>
            <p className="text-text-tertiary text-lg">Propulsé par l'IA, calibré pour les gamers.</p>
          </m.div>

          <div className="grid md:grid-cols-3 gap-6">
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
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'var(--color-primary-10)' }}
                  >
                    <Icon className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">{f.title}</h3>
                  <p className="text-text-tertiary text-base leading-relaxed">{f.desc}</p>
                </m.div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* How it works */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">Comment ça fonctionne</h2>
          </m.div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <m.div
                key={step.num}
                variants={scrollRevealLight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-6 md:p-8 rounded-2xl bg-gradient-to-br from-surface-card to-transparent border border-border-subtle text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">{step.num}</span>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">{step.title}</h3>
                <p className="text-text-tertiary text-base leading-relaxed">{step.desc}</p>
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
              <h2 className="text-xl md:text-3xl font-bold text-text-primary mb-4">Envie d'un coach perso ?</h2>
              <p className="text-text-tertiary mb-8 text-lg">Essaie Premium 7 jours gratuit. Le coach IA est inclus.</p>
              <m.div whileHover={{ scale: 1.03, y: -3 }} {...springTap} className="inline-flex">
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary-bg text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow"
                >
                  Essayer gratuitement
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </m.div>
              <p className="text-base text-text-quaternary mt-4">7 jours gratuit &middot; Annulation libre</p>
            </div>
          </m.div>
        </div>
      </section>
    </PublicPageShell>
  )
}
