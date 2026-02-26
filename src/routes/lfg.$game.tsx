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
  blue: '#818CF8',
  purple: '#a855f7',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  emerald: '#10b981',
  green: '#22c55e',
  orange: '#f97316',
  indigo: '#8B5CF6',
  lime: '#84cc16',
}

function getGameColor(color: string): string {
  return GAME_COLORS[color] || '#8B5CF6'
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
    {
      property: 'og:description',
      content: `Trouvez des joueurs ${game.name} et formez votre squad idéale.`,
    },
  ]
}

// ── Components ─────────────────────────────────────
function GameNotFound() {
  return (
    <PublicPageShell>
      <div className="flex flex-col items-center justify-center px-4 py-32">
        <m.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center"
        >
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
    title: 'Zéro toxique, zéro smurf',
    desc: (name: string) =>
      `Chaque joueur ${name} est vérifié. Tu vois son score de fiabilité avant de jouer avec. Si quelqu'un est toxique, ça se sait.`,
    details: [
      'Profils vérifiés par email',
      'Score de fiabilité visible',
      'Signalement et modération active',
    ],
  },
  {
    icon: Target,
    title: 'Des joueurs de ton niveau',
    desc: (name: string) =>
      `Pas envie de carry des débutants ou de te faire écraser ? Notre matching te connecte avec des joueurs ${name} compatibles.`,
    details: [
      'Matching par rang et style de jeu',
      'Préférences de rôle et plateforme',
      "Le matching s'améliore à chaque session",
    ],
  },
  {
    icon: Users,
    title: "Toujours quelqu'un pour jouer",
    desc: (name: string) =>
      `Tes potes sont pas dispos ? Trouve des joueurs ${name} actifs maintenant. Matin, soir, weekend — il y a toujours du monde.`,
    details: [
      'Joueurs actifs à toute heure',
      'Notifications quand un joueur te match',
      'Sessions ouvertes à rejoindre',
    ],
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
      q: `C'est quoi la différence avec un serveur Discord LFG ?`,
      a: `Sur Discord, tu postes un message et tu pries pour que quelqu'un réponde. Ici, le matchmaking te connecte directement avec des joueurs ${game.name} de ton niveau. Et tu vois leur score de fiabilité avant de jouer.`,
    },
    {
      q: `Comment savoir si un joueur est fiable ?`,
      a: `Chaque joueur a un score basé sur sa présence réelle aux sessions. S'il dit qu'il vient et ne se connecte pas, son score baisse. Tu sais à qui tu as affaire avant de jouer.`,
    },
    {
      q: `Je peux chercher des joueurs ${game.name} de mon niveau ?`,
      a: `Oui. Tu configures ton rang, ton rôle préféré, ta plateforme et tes horaires. Le système te propose uniquement des joueurs compatibles. Plus tu joues, plus le matching est précis.`,
    },
    {
      q: `C'est gratuit ?`,
      a: `Oui, la recherche de joueurs et le matchmaking sont gratuits. Le Premium débloque des filtres avancés et plus de visibilité, mais tu peux trouver ta squad sans payer.`,
    },
  ]

  const steps = [
    {
      step: '1',
      icon: Users,
      title: 'Dis-nous qui tu es',
      desc: `Ton niveau ${game.name}, ton rôle préféré, ta plateforme, tes horaires. 30 secondes et c'est fait.`,
    },
    {
      step: '2',
      icon: Target,
      title: 'On te trouve des joueurs',
      desc: `Notre matching analyse tes préférences et te propose des joueurs ${game.name} compatibles. Pas des randoms.`,
    },
    {
      step: '3',
      icon: Sparkles,
      title: 'Joue et construis ta squad',
      desc: `Accepte une invitation, joue, évalue. Les bons joueurs restent, les autres disparaissent.`,
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
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge-shimmer border mb-8"
              style={{ borderColor: `${gc}25` }}
            >
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
            T'en as marre de jouer avec des randoms qui ragequit au bout de 5 min ? Trouve des
            joueurs {game.name} fiables, de ton niveau, qui tiennent parole
            <span className="text-text-primary font-medium">
              . Gratuit, sans inscription obligatoire.
            </span>
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
              { value: game.estimatedPlayers.split(' ')[0], label: 'joueurs actifs' },
              { value: '24/7', label: 'toujours du monde' },
              { value: '0€', label: 'pour commencer' },
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
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Trouve ta squad en 3 étapes
            </h2>
            <p className="text-text-tertiary text-lg">
              Pas de serveur Discord à rejoindre. Pas de post à écrire. Juste du matching.
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
                    <div
                      className="text-xs font-bold uppercase tracking-wider mb-2"
                      style={{ color: gc }}
                    >
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
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Pas un LFG de plus. Un vrai outil.
            </h2>
            <p className="text-text-tertiary text-lg">
              La différence ? Ici, on vérifie les joueurs et on mesure la fiabilité.
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
                          <li
                            key={detail}
                            className="flex items-center gap-2 text-md text-text-secondary"
                          >
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
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Ils ont trouvé leur squad
            </h2>
          </m.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Alex',
                role: `${game.name} depuis 2 ans`,
                text: "Avant je postais sur r/LFG et je tombais sur des mecs qui quittaient au bout de 2 games. Ici les joueurs ont un score, tu sais à quoi t'attendre.",
                delay: 0.1,
              },
              {
                name: 'Sarah',
                role: `Joueuse ${game.name}`,
                text: "J'avais personne pour jouer ranked. En une semaine j'ai trouvé 3 joueurs réguliers. On joue ensemble tous les mardis et vendredis maintenant.",
                delay: 0.2,
              },
              {
                name: 'Théo',
                role: 'Capitaine de squad',
                text: "Le truc qui change tout c'est le RSVP. Les gens disent OUI ou NON, pas « peut-être ». Du coup quand c'est l'heure, tout le monde est là.",
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
                <p className="text-text-secondary mb-4 italic text-base leading-relaxed">
                  {testimonial.text}
                </p>
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
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
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
              style={{
                background: `radial-gradient(ellipse at center, ${gc}08 0%, transparent 60%)`,
              }}
            />
            <div className="relative z-10">
              <m.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-12 h-12 mx-auto mb-6" style={{ color: gc }} />
              </m.div>
              <h2 className="text-xl md:text-3xl font-bold text-text-primary mb-4">
                Arrête de jouer solo.
              </h2>
              <p className="text-text-tertiary mb-8 text-lg">
                Tes futurs coéquipiers {game.shortName || game.name} sont déjà là. Rejoins-les.
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
                Gratuit · Pas de carte bancaire · Premiers matchs en 24h
              </p>
            </div>
          </m.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Other games ── */}
      <section className="px-4 md:px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <m.div
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-lg md:text-xl font-bold text-text-primary mb-2">
              Tu joues à d'autres jeux ?
            </h2>
            <p className="text-text-quaternary text-md">
              Le matching marche sur tous ces jeux aussi
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
