'use client'

import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Check, X, ArrowRight, Calendar, Users, Sparkles, Shield } from '../components/icons'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const containerVariants = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2
    }
  }
}

export default function AlternativeDiscordEvents() {
  const limitations = [
    {
      title: 'RSVP Basique',
      discord: 'Les RSVP Discord sont simples, mais pas fiables. Les joueurs disent oui mais ne viennent pas.',
      squadPlanner: 'Notifications push, rappels, statistiques de fiabilité. Les joueurs qui flakent sont identifiés.',
      icon: Check
    },
    {
      title: 'Récurrence Limitée',
      discord: 'Un seul événement Discord à la fois. Pas de sessions hebdo automatisées.',
      squadPlanner: 'Crée des récurrences hebdo, bi-hebdo, mensuelles. Automatisation complète.',
      icon: Calendar
    },
    {
      title: 'Pas d\'Analytics',
      discord: 'Discord ne montre que qui a confirmé ou non. Aucune insight sur la participation.',
      squadPlanner: 'Analytics complets : taux de présence, tendances, statistiques par joueur.',
      icon: Sparkles
    }
  ]

  const advantages = [
    {
      title: 'RSVP Fiable',
      description: 'Les notifications push et rappels 1h avant l\'événement. Ton taux de présence augmente automatiquement.',
      icon: Check
    },
    {
      title: 'Optimisé pour Gaming',
      description: 'Squad Planner est 100% dédié aux sessions gaming. Discord, c\'est pour communiquer. Nous, c\'est pour organiser.',
      icon: Users
    },
    {
      title: 'Récurrence Native',
      description: 'Les sessions de compétition hebdomadaires se créent en un clic. Plus de copier-coller chaque semaine.',
      icon: Calendar
    },
    {
      title: 'Analytics Avancées',
      description: 'Identifie tes meilleurs joueurs, les plus fiables, les tendances. Données pour prendre de meilleures décisions.',
      icon: Sparkles
    },
    {
      title: 'Intégration Discord',
      description: 'Squad Planner se connecte à Discord. Notifications dans Discord, mais l\'organisation dans Squad Planner.',
      icon: Shield
    },
    {
      title: 'Plus de Fiabilité',
      description: 'Les joueurs ont un profil, une réputation. Les squads sérieuses voient clairement qui flake régulièrement.',
      icon: Check
    }
  ]

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6 leading-tight">
              Plus qu'un simple événement Discord<span className="text-primary">.</span>
            </h1>
            <p className="text-xl text-text-secondary mb-8 max-w-2xl">
              Discord est fait pour la commu, pas pour organiser les sessions. Squad Planner corrige ça. 100% optimisé pour les gamers.
            </p>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex gap-4 flex-wrap"
            >
              <Link
                to="/auth"
                className="px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                Démarrer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/discover"
                className="px-8 py-4 border border-border-subtle text-text-primary rounded-xl font-semibold hover:bg-surface-card transition-colors"
              >
                Voir comment ça marche
              </Link>
            </m.div>
          </m.div>
        </div>
      </section>

      {/* Limitations vs Avantages */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">
              Événements Discord vs Squad Planner
            </h2>
          </m.div>

          <m.div
            variants={containerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {limitations.map((item, idx) => {
              const Icon = item.icon
              return (
                <m.div
                  key={item.title}
                  variants={fadeInUp}
                  className="grid md:grid-cols-2 gap-6 items-stretch"
                >
                  {/* Discord Version */}
                  <div className="p-6 bg-surface-card rounded-2xl border border-red-400/30">
                    <div className="flex items-start gap-3 mb-4">
                      <X className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                      <h3 className="font-semibold text-text-primary">{item.title} sur Discord</h3>
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {item.discord}
                    </p>
                  </div>

                  {/* Squad Planner Version */}
                  <div className="p-6 bg-surface-card rounded-2xl border border-emerald-400/30 relative">
                    <div className="absolute -top-3 -right-3 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                      Mieux
                    </div>
                    <div className="flex items-start gap-3 mb-4">
                      <Check className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                      <h3 className="font-semibold text-text-primary">{item.title} sur Squad Planner</h3>
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {item.squadPlanner}
                    </p>
                  </div>
                </m.div>
              )
            })}
          </m.div>
        </div>
      </section>

      {/* Key Advantages */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">
              Les 6 avantages clés de Squad Planner
            </h2>
          </m.div>

          <m.div
            variants={containerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {advantages.map((advantage) => {
              const Icon = advantage.icon
              return (
                <m.div
                  key={advantage.title}
                  variants={fadeInUp}
                  className="p-6 bg-surface-card rounded-2xl border border-border-subtle hover:border-primary/50 transition-colors"
                >
                  <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-3">{advantage.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{advantage.description}</p>
                </m.div>
              )
            })}
          </m.div>
        </div>
      </section>

      {/* Integration Banner */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl border border-primary/20"
          >
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">
                  Toujours connecté à Discord
                </h3>
                <p className="text-text-secondary mb-4">
                  Squad Planner s'intègre avec Discord. Reçois les notifications dans Discord, mais organise dans Squad Planner. Pas d'installation compliquée, juste une vraie plateforme d'organisation.
                </p>
                <div className="flex items-center gap-2 text-sm text-primary font-semibold">
                  <Check className="w-4 h-4" />
                  Notifications Discord native
                </div>
              </div>
            </div>
          </m.div>
        </div>
      </section>

      {/* Use Case */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-text-primary mb-8 text-center">
              Cas d'usage typique
            </h3>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-surface-card rounded-2xl border border-border-subtle p-8"
          >
            <p className="text-text-secondary mb-6 leading-relaxed">
              Tu as une squad compétitive qui joue chaque mardi à 21h. Sur Discord, tu crées un événement à chaque fois. Avec Squad Planner, tu crées un événement récurrent une fois, et c'est automatisé. Les joueurs reçoivent des notifications push 1h avant. Tu vois qui flake. Tu as des statistiques. C'est ça, une vraie plateforme gaming.
            </p>
            <Link
              to="/auth"
              className="inline-flex px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors items-center gap-2"
            >
              Essayer gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
          </m.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-text-primary mb-6">
              Améliore tes sessions dès aujourd'hui
            </h2>
            <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
              Gratuit pour l'essentiel. Mets à jour tes sessions depuis Discord ou Squad Planner. Zéro friction, juste du gaming efficace.
            </p>
            <Link
              to="/auth"
              className="inline-flex px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors items-center gap-2"
            >
              Créer mon compte
              <ArrowRight className="w-5 h-5" />
            </Link>
          </m.div>
        </div>
      </section>
    </div>
  )
}
