import { useState } from 'react'
import type { HeadersArgs } from 'react-router'
import { useParams, Link } from 'react-router'
import { m } from 'framer-motion'
import { getGameBySlug, GAMES } from '../data/games'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'
import {
  Users,
  ArrowRight,
  Sparkles,
  Star,
  ChevronDown,
  Target,
  Shield,
  Check,
} from '../components/icons'

// ── Color mapping ──────────────────────────────────
const GAME_COLORS: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#a855f7',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  emerald: '#10b981',
  green: '#22c55e',
  orange: '#f97316',
  indigo: '#6366f1',
  lime: '#84cc16',
}

function getGameColor(color: string): string {
  return GAME_COLORS[color] || '#6366f1'
}

// ── SEO ────────────────────────────────────────────
export function headers(_args: HeadersArgs) {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta({ params }: { params: { game: string } }) {
  const game = getGameBySlug(params.game)

  if (!game) {
    return [
      { title: 'Jeu non trouvé - Squad Planner' },
      { name: 'description', content: "Ce jeu n'existe pas ou n'est pas encore disponible." },
    ]
  }

  return [
    { title: `Chercher des joueurs ${game.name} - Squad Planner` },
    {
      name: 'description',
      content: `Trouvez des joueurs ${game.name} fiables et formez une squad complète avec Squad Planner. Matchmaking intelligent et communauté vérifiée.`,
    },
    { tagName: 'link', rel: 'canonical', href: `https://squadplanner.fr/lfg/${game.slug}` },
    { property: 'og:url', content: `https://squadplanner.fr/lfg/${game.slug}` },
    { property: 'og:title', content: `Chercher des joueurs ${game.name}` },
    { property: 'og:description', content: `Trouvez des joueurs ${game.name} et formez votre squad idéale.` },
  ]
}

// ── Components ─────────────────────────────────────
function GameNotFound() {
  return (
    <PublicPageShell>
      <div className="flex flex-col items-center justify-center px-4 py-32">
        <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">Jeu non trouvé</h1>
          <p className="text-text-secondary mb-8">
            Ce jeu n'existe pas ou n'est pas encore disponible sur Squad Planner.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            Retour à l'accueil
            <ArrowRight className="w-5 h-5" />
          </Link>
        </m.div>
      </div>
    </PublicPageShell>
  )
}

const benefits = [
  {
    icon: Shield,
    title: 'Communauté vérifiée',
    desc: (name: string) =>
      `Tous les joueurs ${name} sont vérifiés. Pas de smurf, pas de troll. Jouez en toute confiance.`,
    details: ['Vérification par email', 'Scores de fiabilité', 'Avertissements en temps réel'],
  },
  {
    icon: Target,
    title: 'Matchmaking intelligent',
    desc: (name: string) =>
      `Trouvez des coéquipiers ${name} compatibles avec votre niveau et votre style.`,
    details: ['Matching par compétences', 'Préférences personnalisées', 'Historique des joueurs'],
  },
  {
    icon: Users,
    title: 'Communauté 24/7',
    desc: (name: string) =>
      `Trouvez des joueurs ${name} à l'heure qui vous convient. Toujours quelqu'un pour jouer.`,
    details: ['Matchmaking continu', 'Notifications en temps réel', 'Calendrier des sessions'],
  },
]

// ── Main component ─────────────────────────────────
export default function Component() {
  const { game: gameSlug } = useParams()
  const game = gameSlug ? getGameBySlug(gameSlug) : undefined
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  if (!game) return <GameNotFound />

  const gc = getGameColor(game.color)

  const faqs = [
    {
      q: `Comment trouver des joueurs ${game.name} ?`,
      a: `Crée un profil Squad Planner, active le matchmaking et configure tes préférences ${game.name}. Notre système te recommande les meilleurs coéquipiers. C'est gratuit et rapide.`,
    },
    {
      q: `Comment fonctionne le matching ${game.name} ?`,
      a: `Squad Planner analyse ton niveau, tes préférences et ton historique de jeu. L'IA te propose des joueurs ${game.name} compatibles. Plus tu joues, plus le matching s'améliore.`,
    },
    {
      q: `Que signifie "community verified" ?`,
      a: `Tous nos joueurs sont vérifiés pour éviter les smurf et les troll. Chaque compte a un score de fiabilité basé sur le comportement en squad. Joue en toute confiance.`,
    },
    {
      q: `Comment améliorer mon matching ${game.name} ?`,
      a: `Plus tu joues avec Squad Planner, mieux le system te connait. Fais des retours sur tes coéquipiers, mets à jour ton profil et participe aux sessions. L'IA apprend de ton expérience.`,
    },
  ]

  const steps = [
    {
      step: '1',
      icon: Users,
      title: 'Crée ton profil',
      desc: `Inscris-toi sur Squad Planner et renseigne tes infos ${game.name} : niveau, rôle, plateforme, heures préférées.`,
    },
    {
      step: '2',
      icon: Target,
      title: 'Active le matchmaking',
      desc: `Accède aux préférences de matching et configure ta recherche ${game.name}. Notre IA se met en marche.`,
    },
    {
      step: '3',
      icon: Sparkles,
      title: 'Reçois des invitations',
      desc: `Des joueurs ${game.name} compatibles te contactent. Accepte, joue, évalue. Construis ta squad !`,
    },
  ]

  return (
    <PublicPageShell>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden noise-overlay">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${gc}18 0%, transparent 60%)`,
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge-shimmer border mb-8" style={{ borderColor: `${gc}25` }}>
              <span className="text-4xl">{game.icon}</span>
              <span className="text-base font-medium" style={{ color: gc }}>
                {game.genre} · {game.players}
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
            Cherche des joueurs
            <br />
            <span className="text-gradient-animated">{game.name}</span>
            <br />
            fiables pour ta squad
          </m.h1>

          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Rejoins {game.estimatedPlayers.split(' ')[0]} joueurs {game.name} vérifiés. Matchmaking intelligent, communauté de confiance, squads complètes
            <span className="text-text-primary font-medium">. Gratuit et sans engagement.</span>
          </m.p>

          {/* CTAs */}
          <m.div
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="w-full sm:w-auto">
              <Link
                to="/auth?mode=register&redirect=onboarding"
                className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow w-full sm:w-auto justify-center"
              >
                Rejoindre maintenant
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="w-full sm:w-auto">
              <Link
                to={`/games/${game.slug}`}
                className="flex items-center gap-2 h-14 px-8 rounded-xl border border-border-hover text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-all w-full sm:w-auto justify-center"
              >
                Créer une squad
              </Link>
            </m.div>
          </m.div>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-8 md:gap-16">
            {[
              { value: game.estimatedPlayers.split(' ')[0], label: 'joueurs vérifiés' },
              { value: '24/7', label: 'matchmaking actif' },
              { value: '100%', label: 'gratuit' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl md:text-2xl font-bold text-text-primary">{stat.value}</div>
                <div className="text-sm md:text-base text-text-quaternary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── How it works ── */}
      <section className="px-4 md:px-6 py-12 md:py-16 bg-gradient-to-b from-transparent to-primary/[0.015]">
        <div className="max-w-5xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Comment ça marche
            </h2>
            <p className="text-text-tertiary text-lg">
              3 étapes pour trouver tes coéquipiers {game.name} idéaux
            </p>
          </m.div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => {
              const StepIcon = step.icon
              return (
                <m.div
                  key={step.step}
                  variants={scrollRevealLight}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-surface-card to-transparent border border-border-subtle hover:border-border-hover transition-all group">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                      style={{ backgroundColor: `${gc}12` }}
                    >
                      <StepIcon className="w-6 h-6" style={{ color: gc }} />
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: gc }}>
                      Étape {step.step}
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">{step.title}</h3>
                    <p className="text-md text-text-tertiary">{step.desc}</p>
                  </div>
                </m.div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Benefits pillars ── */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Pourquoi chercher des joueurs sur Squad Planner
            </h2>
            <p className="text-text-tertiary text-lg">
              Chaque fonctionnalité résout un problème des gamers {game.name}.
            </p>
          </m.div>

          <div className="space-y-6">
            {benefits.map((benefit, i) => {
              const BenefitIcon = benefit.icon
              return (
                <m.div
                  key={benefit.title}
                  variants={scrollRevealLight}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-surface-card/80 to-transparent border border-border-subtle hover:border-border-hover transition-all"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${gc}12` }}
                        >
                          <BenefitIcon className="w-6 h-6" style={{ color: gc }} />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary">{benefit.title}</h3>
                      </div>
                      <p className="text-text-tertiary mb-4">{benefit.desc(game.name)}</p>
                      <ul className="space-y-2">
                        {benefit.details.map((detail) => (
                          <li key={detail} className="flex items-center gap-2 text-md text-text-secondary">
                            <Check className="w-4 h-4 flex-shrink-0" style={{ color: gc }} />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </m.div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Testimonials ── */}
      <section className="px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-5xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Ce que disent les joueurs {game.name}
            </h2>
          </m.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Alex T.',
                role: `Joueur ${game.name}`,
                text: 'J\'ai enfin trouvé une squad fiable ! Plus besoin de chercher des joueurs désorganisés.',
                delay: 0.1,
              },
              {
                name: 'Marie L.',
                role: `Compétitrice ${game.name}`,
                text: 'Squad Planner m\'a aidé à trouver des coéquipiers de mon niveau. Nous progressons ensemble.',
                delay: 0.2,
              },
              {
                name: 'Jordan M.',
                role: 'Capitaine de squad',
                text: 'Organiser nos sessions est devenu tellement plus facile. Tout le monde arrive à l\'heure !',
                delay: 0.3,
              },
            ].map((testimonial, idx) => (
              <m.div
                key={idx}
                variants={scrollRevealLight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: testimonial.delay }}
                className="p-6 rounded-2xl bg-gradient-to-br from-surface-card/80 to-transparent border border-border-subtle hover:border-border-hover transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-text-secondary mb-4 italic text-base leading-relaxed">{testimonial.text}</p>
                <div className="border-t border-border-subtle pt-4">
                  <p className="font-semibold text-text-primary">{testimonial.name}</p>
                  <p className="text-sm text-text-tertiary">{testimonial.role}</p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── FAQ ── */}
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
                  <span className="text-md font-medium text-text-primary pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-text-quaternary shrink-0 transition-transform duration-300 ${openFAQ === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className={`faq-answer ${openFAQ === i ? 'open' : ''}`}>
                  <div>
                    <p className="px-5 pb-5 text-md text-text-tertiary leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── CTA final ── */}
      <section className="px-4 md:px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative p-8 md:p-12 rounded-3xl border text-center overflow-hidden"
            style={{
              background: `radial-gradient(ellipse at center, ${gc}10 0%, transparent 60%)`,
              borderColor: `${gc}20`,
            }}
          >
            <m.div
              className="absolute inset-0"
              animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ background: `radial-gradient(ellipse at center, ${gc}08 0%, transparent 60%)` }}
            />
            <div className="relative z-10">
              <m.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-12 h-12 mx-auto mb-6" style={{ color: gc }} />
              </m.div>
              <h2 className="text-xl md:text-3xl font-bold text-text-primary mb-4">
                Prêt à trouver ta squad {game.shortName || game.name} idéale ?
              </h2>
              <p className="text-text-tertiary mb-8 text-lg">
                Gratuit, sans engagement. Reçois tes premières invitations en 24 heures.
              </p>
              <m.div whileHover={{ scale: 1.03, y: -3 }} {...springTap} className="inline-flex">
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="flex items-center gap-2 h-16 px-10 rounded-xl bg-gradient-to-r from-primary to-purple text-white text-xl font-bold mx-auto shadow-lg shadow-primary/20 cta-glow-idle"
                >
                  Rejoindre maintenant
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </m.div>
              <p className="text-base text-text-quaternary mt-4">
                Gratuit · Pas de carte bancaire · Premières invitations en 24h
              </p>
            </div>
          </m.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Other games ── */}
      <section className="px-4 md:px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <m.div variants={scrollRevealLight} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-8">
            <h2 className="text-lg md:text-xl font-bold text-text-primary mb-2">
              Chercher des joueurs sur d'autres jeux
            </h2>
            <p className="text-text-quaternary text-md">
              Trouve tes coéquipiers sur tous tes jeux favoris
            </p>
          </m.div>
          <div className="flex flex-wrap justify-center gap-3">
            {GAMES.filter((g) => g.slug !== game.slug)
              .slice(0, 8)
              .map((g) => (
                <Link
                  key={g.slug}
                  to={`/lfg/${g.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-card border border-border-subtle rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-border-hover transition-all"
                >
                  <span>{g.icon}</span>
                  {g.name}
                </Link>
              ))}
          </div>
        </div>
      </section>
    </PublicPageShell>
  )
}
