'use client'

import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Check, X, ArrowRight, Calendar, Users, Sparkles } from '../components/icons'
import { useState } from 'react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const containerVariants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

export default function AlternativeGuilded() {
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null)

  const features = [
    {
      icon: Calendar,
      name: 'Calendrier & Événements',
      hasOnGuilded: true,
      hasOnSP: true
    },
    {
      icon: Users,
      name: 'Groupes & Communautés',
      hasOnGuilded: true,
      hasOnSP: true
    },
    {
      icon: Sparkles,
      name: 'RSVP Fiable',
      hasOnGuilded: true,
      hasOnSP: true
    },
    {
      icon: Check,
      name: 'Notifications Temps Réel',
      hasOnGuilded: false,
      hasOnSP: true
    }
  ]

  const faqs = [
    {
      id: 'why-closed',
      question: 'Pourquoi Guilded a fermé ?',
      answer: 'Guilded a annoncé la fermeture de sa plateforme en 2024. Beaucoup de joueurs cherchent maintenant une alternative fiable pour organiser leurs sessions gaming.'
    },
    {
      id: 'migration',
      question: 'Comment migrer de Guilded à Squad Planner ?',
      answer: 'Squad Planner offre un import facile. Partage tes serveurs Guilded, et nous t\'aiderons à importer les informations essentielles. Utilise le code GUILDED30 pour 30% sur ton premier mois.'
    },
    {
      id: 'data-loss',
      question: 'Est-ce que mes données seront perdues ?',
      answer: 'Non. Squad Planner sauvegarde toutes tes squads, événements et paramètres. Tu ne perdras rien en changeant de plateforme.'
    },
    {
      id: 'free',
      question: 'Squad Planner est vraiment gratuit ?',
      answer: 'Oui ! Squad Planner est gratuit avec les fonctionnalités essentielles. Une version Premium offre des analyses avancées, mais le calendrier et les RSVP restent gratuits.'
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
              Guilded a fermé<span className="text-primary">.</span>
            </h1>
            <p className="text-xl text-text-secondary mb-8 max-w-2xl">
              Ta nouvelle maison gaming est ici. Squad Planner offre tout ce que tu aimais sur Guilded, mais en mieux.
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
                Commencer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/discover"
                className="px-8 py-4 border border-border-subtle text-text-primary rounded-xl font-semibold hover:bg-surface-card transition-colors"
              >
                Voir les squads
              </Link>
            </m.div>
          </m.div>
        </div>
      </section>

      {/* Ce que tu aimais sur Guilded */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">
              Ce que tu aimais sur Guilded, Squad Planner l'a (et plus)
            </h2>
          </m.div>

          <m.div
            variants={containerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6"
          >
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <m.div
                  key={feature.name}
                  variants={fadeInUp}
                  className="p-6 bg-surface-card rounded-2xl border border-border-subtle"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary mb-3">{feature.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        {feature.hasOnGuilded ? (
                          <div className="flex items-center gap-1">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Sur Guilded</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <X className="w-4 h-4 text-red-400" />
                            <span>Pas sur Guilded</span>
                          </div>
                        )}
                        <span className="mx-2">·</span>
                        <div className="flex items-center gap-1">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Sur Squad Planner</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </m.div>
              )
            })}
          </m.div>
        </div>
      </section>

      {/* Code Promo */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl border border-primary/20 text-center"
          >
            <h3 className="text-2xl font-bold text-text-primary mb-2">
              30% off pour les utilisateurs Guilded
            </h3>
            <p className="text-text-secondary mb-4">Utilise le code</p>
            <div className="inline-block px-6 py-3 bg-primary/20 rounded-xl mb-4">
              <code className="text-2xl font-bold text-primary">GUILDED30</code>
            </div>
            <p className="text-sm text-text-secondary">
              30% de réduction sur votre premier mois Premium
            </p>
          </m.div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">
              Questions Fréquentes
            </h2>
          </m.div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <m.div
                key={faq.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <button
                  onClick={() =>
                    setExpandedFaqId(expandedFaqId === faq.id ? null : faq.id)
                  }
                  className="w-full text-left p-6 bg-surface-card rounded-xl border border-border-subtle hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {faq.question}
                    </h3>
                    <div className="flex-shrink-0">
                      <m.div
                        animate={{ rotate: expandedFaqId === faq.id ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <svg
                          className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                          />
                        </svg>
                      </m.div>
                    </div>
                  </div>
                  <m.div
                    initial={false}
                    animate={{
                      height: expandedFaqId === faq.id ? 'auto' : 0,
                      opacity: expandedFaqId === faq.id ? 1 : 0,
                      marginTop: expandedFaqId === faq.id ? 16 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </m.div>
                </button>
              </m.div>
            ))}
          </div>
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
              Prêt à rejoindre Squad Planner ?
            </h2>
            <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
              Gratuit pour commencer. Rejoins des milliers de joueurs qui organisent leurs sessions gaming avec Squad Planner.
            </p>
            <Link
              to="/auth"
              className="inline-flex px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors items-center gap-2"
            >
              Rejoins Squad Planner gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
          </m.div>
        </div>
      </section>
    </div>
  )
}
