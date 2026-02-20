import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Check, ArrowRight, Calendar, Users, Sparkles, ChevronDown } from '../components/icons'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'
import { useState } from 'react'

const features = [
  {
    icon: Calendar,
    name: 'Calendrier & Événements',
    hasOnSP: true
  },
  {
    icon: Users,
    name: 'Groupes & Communautés',
    hasOnSP: true
  },
  {
    icon: Sparkles,
    name: 'RSVP Fiable',
    hasOnSP: true
  },
  {
    icon: Check,
    name: 'Notifications Temps Réel',
    hasOnSP: true
  }
]

const faqs = [
  {
    id: 'why-closed',
    question: 'Pourquoi Guilded a fermé ?',
    answer: 'Guilded a fermé boutique en 2024. Tous les gamers cherchaient un spot où aller. Squad Planner, c\'est là pour ça.'
  },
  {
    id: 'migration',
    question: 'Comment passer de Guilded à Squad Planner ?',
    answer: 'Ultra simple. Partage tes squads Guilded, on importe l\'essentiel. Code GUILDED30 pour 30% sur ton premier mois Premium. Après, t\'as les features gratuites à vie.'
  },
  {
    id: 'data-loss',
    question: 'Mais je perds mes données ?',
    answer: 'Zero. Squad Planner garde tout : squads, événements, paramètres. Rien ne se perd. T\'es tranquille.'
  },
  {
    id: 'free',
    question: 'C\'est vraiment gratuit ?',
    answer: 'Oui. Calendrier illimité, RSVP, notifications. Tout ça gratuit. Premium te donne des analytics avancées si tu veux. Mais l\'essentiel reste gratuit.'
  }
]

export default function AlternativeGuilded() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

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
                Guilded a fermé · On t'accueille
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
            Guilded s'en va<span className="text-gradient-animated">.</span>
            <br />
            Ton nouveau spot gaming
            <br />
            c'est ici.
          </m.h1>

          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Même vibe que Guilded, mais taillé pour tes sessions. Calendrier, RSVP qui tient, notifications push. Organise sans prise de tête.
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
                Essayer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="w-full sm:w-auto">
              <Link
                to="/auth?mode=register&redirect=onboarding"
                className="flex items-center gap-2 h-14 px-8 rounded-xl border border-border-hover text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-all w-full sm:w-auto justify-center"
              >
                Créer mon compte
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
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Ce qui marchait sur Guilded, c'est encore meilleur ici
            </h2>
            <p className="text-text-tertiary text-lg">
              Tout pour organiser tes sessions sans galère.
            </p>
          </m.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => {
              const FeatureIcon = feature.icon
              return (
                <m.div
                  key={feature.name}
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
                      style={{ backgroundColor: '#a855f712' }}
                    >
                      <FeatureIcon className="w-6 h-6" style={{ color: '#a855f7' }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary mb-2">{feature.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Squad Planner</span>
                      </div>
                    </div>
                  </div>
                </m.div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Promo Code */}
      <section className="px-4 md:px-6 py-12 md:py-16 bg-gradient-to-b from-transparent to-purple/[0.015]">
        <div className="max-w-3xl mx-auto">
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative p-8 md:p-12 rounded-3xl border overflow-hidden text-center"
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
              <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-2">
                30% de réduction pour les migrés de Guilded
              </h3>
              <p className="text-text-tertiary mb-6">Tape ce code</p>
              <div className="inline-block px-8 py-4 bg-purple/10 rounded-xl mb-6 border border-purple/20">
                <code className="text-2xl md:text-3xl font-bold text-purple">GUILDED30</code>
              </div>
              <p className="text-base text-text-secondary">
                30% sur ton premier mois Premium
              </p>
            </div>
          </m.div>
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
                  <span className="text-md font-medium text-text-primary pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-text-quaternary shrink-0 transition-transform duration-300 ${openFAQ === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className={`faq-answer ${openFAQ === i ? 'open' : ''}`}>
                  <div>
                    <p className="px-5 pb-5 text-md text-text-tertiary leading-relaxed">{faq.answer}</p>
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
                Prêt à changer de maison ?
              </h2>
              <p className="text-text-tertiary mb-8 text-lg">
                C'est gratuit. Crée ta première session en 30 secondes.
              </p>
              <m.div whileHover={{ scale: 1.03, y: -3 }} {...springTap} className="inline-flex">
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="flex items-center gap-2 h-16 px-10 rounded-xl bg-gradient-to-r from-primary to-purple text-white text-xl font-bold mx-auto shadow-lg shadow-primary/20 cta-glow-idle"
                >
                  Essayer maintenant
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
