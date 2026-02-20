import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Check, ArrowRight, Calendar, Users, Sparkles, Shield, Zap } from '../components/icons'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'

const limitations = [
  {
    title: 'RSVP Basique',
    discord: 'Les RSVP Discord sont simples, mais pas fiables. Les joueurs disent oui mais ne viennent pas.',
    squadPlanner: 'Notifications push, rappels, statistiques de fiabilité. Les joueurs qui flakent sont identifiés.',
  },
  {
    title: 'Récurrence Limitée',
    discord: 'Un seul événement Discord à la fois. Pas de sessions hebdo automatisées.',
    squadPlanner: 'Crée des récurrences hebdo, bi-hebdo, mensuelles. Automatisation complète.',
  },
  {
    title: 'Pas d\'Analytics',
    discord: 'Discord ne montre que qui a confirmé ou non. Aucune insight sur la participation.',
    squadPlanner: 'Analytics complets : taux de présence, tendances, statistiques par joueur.',
  }
]

const advantages = [
  {
    title: 'RSVP Fiable',
    description: 'Notifications push et rappels 1h avant. Ton taux de présence augmente automatiquement.',
    icon: Check
  },
  {
    title: 'Optimisé pour Gaming',
    description: 'Squad Planner est 100% dédié aux sessions. Discord pour la commu, nous pour organiser.',
    icon: Users
  },
  {
    title: 'Récurrence Native',
    description: 'Sessions hebdomadaires en un clic. Plus de copier-coller chaque semaine.',
    icon: Calendar
  },
  {
    title: 'Analytics Avancées',
    description: 'Identifie tes meilleurs joueurs, les plus fiables, les tendances. Décisions data-driven.',
    icon: Sparkles
  },
  {
    title: 'Intégration Discord',
    description: 'Notifications Discord native, organisation dans Squad Planner. Le meilleur des deux mondes.',
    icon: Shield
  },
  {
    title: 'Plus de Fiabilité',
    description: 'Profils, réputation, historique. Les squads sérieuses voient clairement qui flake.',
    icon: Zap
  }
]

export default function AlternativeDiscordEvents() {
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
                Au-delà des événements Discord
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
            Plus qu'un simple
            <br />
            événement Discord<span className="text-gradient-animated">.</span>
          </m.h1>

          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Discord est fait pour la commu, pas pour organiser les sessions. Squad Planner corrige ça. 100% optimisé pour les gamers, avec intégration Discord native.
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
                Démarrer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="w-full sm:w-auto">
              <Link
                to="/discover"
                className="flex items-center gap-2 h-14 px-8 rounded-xl border border-border-hover text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-all w-full sm:w-auto justify-center"
              >
                Voir comment ça marche
              </Link>
            </m.div>
          </m.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Limitations vs Advantages */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Événements Discord vs Squad Planner
            </h2>
            <p className="text-text-tertiary text-lg">
              Chaque domaine montre les différences clés
            </p>
          </m.div>

          <div className="space-y-6">
            {limitations.map((item, i) => {
              return (
                <m.div
                  key={item.title}
                  variants={scrollRevealLight}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="grid md:grid-cols-2 gap-6"
                >
                  {/* Discord Version */}
                  <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-surface-card to-transparent border border-red-500/20 hover:border-red-500/30 transition-all">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-red-500/10 rounded-lg flex-shrink-0">
                        <Zap className="w-5 h-5 text-red-500" />
                      </div>
                      <h3 className="font-semibold text-text-primary">{item.title}</h3>
                    </div>
                    <p className="text-text-secondary text-md leading-relaxed">
                      {item.discord}
                    </p>
                  </div>

                  {/* Squad Planner Version */}
                  <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-surface-card to-transparent border border-emerald-500/20 hover:border-emerald-500/30 transition-all relative">
                    <div className="absolute -top-3 -right-3 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                      Mieux
                    </div>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-emerald-500/10 rounded-lg flex-shrink-0">
                        <Check className="w-5 h-5 text-emerald-500" />
                      </div>
                      <h3 className="font-semibold text-text-primary">{item.title}</h3>
                    </div>
                    <p className="text-text-secondary text-md leading-relaxed">
                      {item.squadPlanner}
                    </p>
                  </div>
                </m.div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Key Advantages */}
      <section className="px-4 md:px-6 py-12 md:py-16 bg-gradient-to-b from-transparent to-purple/[0.015]">
        <div className="max-w-5xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Les 6 avantages clés de Squad Planner
            </h2>
            <p className="text-text-tertiary text-lg">
              Construis sur ce que tu aimes de Discord, mais pour les sessions gaming
            </p>
          </m.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Integration Banner */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-surface-card/80 to-transparent border border-border-subtle hover:border-border-hover transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-text-primary mb-3">
                  Toujours connecté à Discord
                </h3>
                <p className="text-text-secondary mb-4 text-md">
                  Squad Planner s'intègre nativement avec Discord. Reçois les notifications dans Discord, organise dans Squad Planner. Le meilleur des deux mondes, sans complications.
                </p>
                <div className="flex items-center gap-2 text-sm text-primary font-semibold">
                  <Check className="w-4 h-4" />
                  Notifications Discord native · Zéro configuration
                </div>
              </div>
            </div>
          </m.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Use Case */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-8">
            <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Cas d'usage typique
            </h3>
          </m.div>

          <m.div
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-surface-card/80 to-transparent border border-border-subtle hover:border-border-hover transition-all"
          >
            <p className="text-text-secondary mb-8 leading-relaxed text-lg">
              Tu as une squad compétitive qui joue chaque mardi à 21h. Sur Discord, tu crées un événement à chaque fois. Avec Squad Planner, tu crées un événement récurrent une fois, c'est automatisé. Les joueurs reçoivent des notifications push 1h avant. Tu vois qui flake. Tu as des statistiques. C'est ça, une vraie plateforme gaming.
            </p>
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap}>
              <Link
                to="/auth?mode=register&redirect=onboarding"
                className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/10 hover:bg-primary/90 transition-colors"
              >
                Essayer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
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
                Améliore tes sessions dès aujourd'hui
              </h2>
              <p className="text-text-tertiary mb-8 text-lg">
                Gratuit pour l'essentiel. Zéro friction, juste du gaming efficace.
              </p>
              <m.div whileHover={{ scale: 1.03, y: -3 }} {...springTap} className="inline-flex">
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="flex items-center gap-2 h-16 px-10 rounded-xl bg-gradient-to-r from-primary to-purple text-white text-xl font-bold mx-auto shadow-lg shadow-primary/20 cta-glow-idle"
                >
                  Créer mon compte
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
