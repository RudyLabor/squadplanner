import { Link } from 'react-router'
import { m } from 'framer-motion'
import { ArrowRight, Check, Users, Calendar, CheckCircle, Gamepad2 } from '../components/icons'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'

const steps = [
  {
    num: '1',
    icon: Users,
    title: 'Crée ta squad',
    desc: 'Invite tes potes avec un simple code. Ils rejoignent en un clic, sans inscription compliquée.',
  },
  {
    num: '2',
    icon: Calendar,
    title: 'Planifie tes sessions',
    desc: "Choisis le jeu, la date et l'heure. Définis un seuil de joueurs pour confirmer automatiquement.",
  },
  {
    num: '3',
    icon: CheckCircle,
    title: 'Confirme ta présence',
    desc: 'RSVP en un clic : Présent, Absent ou Peut-être. Tout le monde sait qui sera là.',
  },
  {
    num: '4',
    icon: Gamepad2,
    title: 'Joue ensemble',
    desc: 'Check-in le jour J, lance le voice chat et profite de ta session. Le score de fiabilité fait le reste.',
  },
]

const highlights = [
  { text: 'Notifications push pour ne jamais rater une session' },
  { text: 'Score de fiabilité pour identifier les joueurs sérieux' },
  { text: 'Challenges et XP pour rester motivé' },
  { text: "Voice chat intégré, pas besoin d'app tierce" },
  { text: 'Gratuit pour 1 squad et 5 membres' },
]

export default function HowItWorks() {
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
              <span className="text-base font-medium text-primary">4 étapes, 30 secondes</span>
            </div>
          </m.div>

          <m.h1
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-text-primary mb-6 leading-tight tracking-tight"
          >
            Comment ça marche
          </m.h1>

          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            De la création de ta squad à ta première session, tout est fluide. Pas de friction, pas de prise de tête.
          </m.p>

          <m.div variants={scrollRevealLight} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="inline-flex">
              <Link
                to="/auth?mode=register&redirect=onboarding"
                className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary-bg text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow"
              >
                Créer ma squad
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
          </m.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Steps */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <m.div
                  key={step.num}
                  variants={scrollRevealLight}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative p-6 md:p-8 rounded-2xl bg-gradient-to-br from-surface-card to-transparent border border-border-subtle hover:border-border-hover transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{step.num}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary mb-2">{step.title}</h3>
                      <p className="text-text-tertiary text-base leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </m.div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Highlights */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">Et ce n'est que le début</h2>
            <p className="text-text-tertiary text-lg">Squad Planner inclut tout ce dont ta squad a besoin.</p>
          </m.div>

          <div className="space-y-4">
            {highlights.map((h, i) => (
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
                <span className="text-text-primary text-base">{h.text}</span>
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
              <h2 className="text-xl md:text-3xl font-bold text-text-primary mb-4">Prêt en 30 secondes</h2>
              <p className="text-text-tertiary mb-8 text-lg">Crée ton compte, invite tes potes, planifie ta première session.</p>
              <m.div whileHover={{ scale: 1.03, y: -3 }} {...springTap} className="inline-flex">
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary-bg text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow"
                >
                  C'est parti
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </m.div>
              <p className="text-base text-text-quaternary mt-4">100% gratuit &middot; Pas de carte bancaire &middot; 30 secondes</p>
            </div>
          </m.div>
        </div>
      </section>
    </PublicPageShell>
  )
}
