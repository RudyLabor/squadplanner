import { useState } from 'react'
import type { HeadersArgs } from 'react-router'
import { useParams, Link } from 'react-router'
import { m } from 'framer-motion'
import { getGameBySlug, GAMES } from '../data/games'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'
import {
  Calendar,
  Users,
  Shield,
  Star,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Check,
  Target,
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

  const title = `Planifier des sessions ${game.name} - Squad Planner`
  const description = game.seoDescription

  return [
    { title },
    { name: 'description', content: description },
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: `https://squadplanner.fr/games/${game.slug}` },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `https://squadplanner.fr/games/${game.slug}` },
    { property: 'og:title', content: `Planifier des sessions ${game.name}` },
    { property: 'og:description', content: description },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: `Planifier des sessions ${game.name}` },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'VideoGame',
            name: game.name,
            description: game.description,
            genre: game.genre,
            url: `https://squadplanner.fr/games/${game.slug}`,
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: `Comment planifier une session ${game.name} ?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `Utilise Squad Planner pour créer une session ${game.name}, inviter tes amis et gérer les confirmations de présence automatiquement.`,
                },
              },
              {
                '@type': 'Question',
                name: `Comment trouver des joueurs ${game.name} ?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `Active le matchmaking Squad Planner pour recevoir des invitations de squads ${game.name} compatibles.`,
                },
              },
            ],
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://squadplanner.fr/' },
              { '@type': 'ListItem', position: 2, name: 'Jeux' },
              { '@type': 'ListItem', position: 3, name: game.name, item: `https://squadplanner.fr/games/${game.slug}` },
            ],
          },
        ],
      },
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
          viewport={{ once: true, margin: '200px' }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-text-primary mb-4">Jeu non trouvé</h1>
          <p className="text-text-secondary mb-8">
            Ce jeu n'existe pas ou n'est pas encore disponible sur Squad Planner.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-bg text-white rounded-xl hover:bg-primary-bg-hover transition-colors"
          >
            Retour à l'accueil
            <ArrowRight className="w-5 h-5" />
          </Link>
        </m.div>
      </div>
    </PublicPageShell>
  )
}

const features = [
  {
    icon: Shield,
    title: 'Fini les no-shows',
    desc: (name: string) =>
      `Chaque joueur répond OUI ou NON. Pas de « peut-être ». Et si quelqu'un ghost ta session ${name}, son score le montre.`,
    details: [
      'Rappels automatiques avant chaque session — plus personne n\'oublie',
      'Score de fiabilité visible par tous — tu sais sur qui compter',
      'Confirmation dès qu\'assez de joueurs répondent — bloque ton soir en toute confiance',
    ],
  },
  {
    icon: Users,
    title: 'Trouve ta squad idéale',
    desc: (name: string) =>
      `T'as pas 5 potes dispos en même temps ? Notre matchmaking te connecte avec des joueurs ${name} de ton niveau.`,
    details: [
      'Matching par niveau et style de jeu',
      'Profils vérifiés par email, score de fiabilité visible',
      'Historique et avis des coéquipiers',
    ],
  },
  {
    icon: Calendar,
    title: 'Organise sans prise de tête',
    desc: (name: string) =>
      `Propose un créneau ${name}, partage le lien. Tout le monde voit qui vient. Fini le spam Discord.`,
    details: [
      'Création de session en quelques clics',
      'Sessions récurrentes (chaque mardi soir, etc.)',
      'Synchro avec ton calendrier',
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
      q: `C'est quoi Squad Planner pour ${game.name} ?`,
      a: `C'est un outil gratuit pour organiser tes sessions ${game.name} sans galère. Tu crées ta squad, tu proposes un créneau, chacun répond OUI ou NON. Plus besoin de spammer le groupe Discord.`,
    },
    {
      q: `Mes potes doivent s'inscrire pour rejoindre ?`,
      a: `Non, tu leur envoies un lien et ils rejoignent en 10 secondes. Ils peuvent créer un compte plus tard s'ils veulent. L'idée c'est zéro friction.`,
    },
    {
      q: `C'est vraiment gratuit ?`,
      a: `Oui. Créer une squad, planifier des sessions, inviter tes potes, tout ça c'est gratuit. Le Premium ajoute des heatmaps de présence, des tendances par joueur et des sessions illimitées, mais tu peux jouer sans payer.`,
    },
    {
      q: `Comment ça gère les joueurs qui ghostent ?`,
      a: `Chaque joueur a un score de fiabilité basé sur sa présence réelle. Si quelqu'un dit qu'il vient et ne se connecte pas, son score baisse. Tu sais à qui faire confiance.`,
    },
  ]

  const steps = [
    {
      step: '1',
      icon: Users,
      title: 'Crée ta squad',
      desc: `Donne un nom, choisis ${game.shortName || game.name}. Partage le lien, tes potes rejoignent en 10 secondes.`,
    },
    {
      step: '2',
      icon: Calendar,
      title: 'Propose un créneau',
      desc: `Vendredi 21h, ranked ${game.shortName || game.name} ? Chacun répond OUI ou NON. Pas de « peut-être ».`,
    },
    {
      step: '3',
      icon: Target,
      title: 'Jouez. Pour de vrai.',
      desc: `Rappels automatiques, check-in, tout le monde est là. Semaine après semaine, ta squad tient parole.`,
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
            viewport={{ once: true, margin: '200px' }}
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
            viewport={{ once: true, margin: '200px' }}
            className="text-3xl md:text-5xl font-extrabold text-text-primary mb-6 leading-tight tracking-tight"
          >
            Planifie tes sessions{' '}
            <br />
            <span className="text-gradient-animated">{game.name}</span>{' '}
            <br />
            avec ta squad
          </m.h1>

          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '200px' }}
            className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            {game.description}
            <span className="text-text-primary font-medium"> {game.estimatedPlayers}.</span>
          </m.p>

          {/* CTAs */}
          <m.div
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '200px' }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="w-full sm:w-auto">
              <Link
                to="/auth?mode=register&redirect=onboarding"
                className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary-bg text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow w-full sm:w-auto justify-center"
              >
                Créer ma squad {game.shortName || game.name}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="w-full sm:w-auto">
              <Link
                to={`/lfg/${game.slug}`}
                className="flex items-center gap-2 h-14 px-8 rounded-xl border border-border-hover text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-all w-full sm:w-auto justify-center"
              >
                <Users className="w-5 h-5" />
                Chercher des joueurs
              </Link>
            </m.div>
          </m.div>

          <p className="text-sm text-text-quaternary -mt-6 mb-8">
            100% gratuit · Pas de carte bancaire · Prêt en 30 secondes
          </p>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-8 md:gap-16">
            {[
              { value: game.estimatedPlayers.split(' ')[0], label: 'joueurs actifs' },
              { value: '30s', label: 'pour créer ta squad' },
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
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '200px' }}
            className="text-center mb-12"
          >
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              3 étapes. C'est tout.
            </h2>
            <p className="text-text-tertiary text-lg">
              De zéro à ta première session {game.name} en moins d'une minute
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
                  viewport={{ once: true, margin: '200px' }}
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
                    <p className="text-base text-text-tertiary">{step.desc}</p>
                  </div>
                </m.div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Features pillars ── */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '200px' }}
            className="text-center mb-12"
          >
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Ce que Squad Planner change pour {game.name}
            </h2>
            <p className="text-text-tertiary text-lg">
              T'as déjà essayé d'organiser une session sur Discord ? Voilà pourquoi on existe.
            </p>
          </m.div>

          <div className="space-y-6">
            {features.map((feat, i) => {
              const FeatIcon = feat.icon
              return (
                <m.div
                  key={feat.title}
                  variants={scrollRevealLight}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '200px' }}
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
                          <FeatIcon className="w-6 h-6" style={{ color: gc }} />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary">{feat.title}</h3>
                      </div>
                      <p className="text-text-tertiary mb-4">{feat.desc(game.name)}</p>
                      <ul className="space-y-2">
                        {feat.details.map((detail) => (
                          <li
                            key={detail}
                            className="flex items-center gap-2 text-base text-text-secondary"
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

      {/* ── Why this game + Squad Planner (R11) ── */}
      <section className="px-4 md:px-6 py-12 md:py-16 bg-gradient-to-b from-transparent to-primary/[0.01]">
        <div className="max-w-4xl mx-auto">
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '200px' }}
            className="text-center mb-10"
          >
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
              Pourquoi {game.name} + Squad Planner
            </h2>
            <p className="text-text-tertiary text-lg max-w-2xl mx-auto">
              {game.specificPainPoint}. {game.specificUseCase}.
            </p>
          </m.div>

          <m.div
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '200px' }}
            className="grid sm:grid-cols-3 gap-4 mb-10"
          >
            {game.specificFeatures.map((feat, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-surface-card border border-border-subtle text-center"
              >
                <Check className="w-5 h-5 mx-auto mb-2" style={{ color: gc }} />
                <p className="text-sm font-medium text-text-primary">{feat}</p>
              </div>
            ))}
          </m.div>

          {/* Testimonial (R13) */}
          <m.div
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '200px' }}
            className="p-6 rounded-2xl border border-border-subtle bg-gradient-to-br from-surface-card to-transparent"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold text-white"
                style={{ backgroundColor: gc }}
              >
                {game.testimonial.author[0]}
              </div>
              <div>
                <p className="text-text-primary text-base italic mb-2">
                  &laquo;{game.testimonial.quote}&raquo;
                </p>
                <p className="text-sm text-text-tertiary">
                  <span className="font-medium text-text-secondary">{game.testimonial.author}</span>
                  {' '}· {game.testimonial.role} · {game.testimonial.rank}
                </p>
              </div>
            </div>
          </m.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Premium CTA (R4) ── */}
      <section className="px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-3xl mx-auto">
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '200px' }}
            className="p-6 md:p-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent text-center"
          >
            <h3 className="text-lg font-bold text-text-primary mb-2">
              Envie de plus pour ta squad {game.shortName || game.name} ?
            </h3>
            <p className="text-text-tertiary mb-5 text-base max-w-lg mx-auto">
              Sessions illimitées, heatmaps de présence, coach IA et audio HD. Essaie Premium 7 jours gratuits.
            </p>
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="inline-flex">
              <Link
                to="/premium"
                className="flex items-center gap-2 h-12 px-8 rounded-xl bg-gradient-to-r from-primary to-purple text-white font-semibold shadow-lg shadow-primary/10"
              >
                Découvrir Premium — à partir de 0,23€/jour
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
            <p className="text-xs text-text-quaternary mt-3">
              7 jours gratuits · Sans carte bancaire · Remboursé sous 30 jours
            </p>
          </m.div>
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
            viewport={{ once: true, margin: '200px' }}
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
                viewport={{ once: true, margin: '200px' }}
                className="border border-border-subtle rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-bg-elevated/50 transition-colors"
                  aria-expanded={openFAQ === i}
                >
                  <span className="text-base font-medium text-text-primary pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-text-quaternary shrink-0 transition-transform duration-300 ${openFAQ === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className={`faq-answer ${openFAQ === i ? 'open' : ''}`}>
                  <div>
                    <p className="px-5 pb-5 text-base text-text-tertiary leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cross-linking SEO ── */}
      <section className="px-4 md:px-6 py-12 bg-gradient-to-b from-primary/[0.015] to-transparent">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-text-primary mb-6">
            Ressources pour les joueurs {game.name}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to={`/lfg/${game.slug}`}
              className="p-4 rounded-xl border border-border-subtle hover:border-primary/30 bg-surface-card/50 transition-all group"
            >
              <div className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                Chercher des joueurs {game.name}
              </div>
              <p className="text-xs text-text-tertiary mt-1">Trouve des coéquipiers fiables pour tes sessions</p>
            </Link>
            <Link
              to="/blog"
              className="p-4 rounded-xl border border-border-subtle hover:border-primary/30 bg-surface-card/50 transition-all group"
            >
              <div className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                Guides et astuces gaming
              </div>
              <p className="text-xs text-text-tertiary mt-1">Conseils pour organiser ta squad et éviter les no-shows</p>
            </Link>
            <Link
              to="/alternative/guilded"
              className="p-4 rounded-xl border border-border-subtle hover:border-primary/30 bg-surface-card/50 transition-all group"
            >
              <div className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                Alternatives à Guilded
              </div>
              <p className="text-xs text-text-tertiary mt-1">Guilded a fermé : découvre les meilleures alternatives</p>
            </Link>
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
            viewport={{ once: true, margin: '200px' }}
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
                Ta squad {game.shortName || game.name} t'attend
              </h2>
              <p className="text-text-tertiary mb-8 text-lg">
                Crée ta squad, invite tes potes, et jouez ce soir. C'est gratuit.
              </p>
              <m.div whileHover={{ scale: 1.03, y: -3 }} {...springTap} className="inline-flex">
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="flex items-center gap-2 h-16 px-10 rounded-xl bg-gradient-to-r from-primary to-purple text-white text-xl font-bold mx-auto shadow-lg shadow-primary/20 cta-glow-idle"
                >
                  Créer ma squad maintenant
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </m.div>
              <p className="text-base text-text-quaternary mt-4">
                Gratuit · Pas de carte bancaire · Prêt en 30 secondes
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
            viewport={{ once: true, margin: '200px' }}
            className="text-center mb-8"
          >
            <h2 className="text-lg md:text-xl font-bold text-text-primary mb-2">
              Tu joues à autre chose aussi ?
            </h2>
            <p className="text-text-quaternary text-base">Squad Planner marche avec tous tes jeux</p>
          </m.div>
          <div className="flex flex-wrap justify-center gap-3">
            {GAMES.filter((g) => g.slug !== game.slug)
              .slice(0, 8)
              .map((g) => (
                <Link
                  key={g.slug}
                  to={`/games/${g.slug}`}
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
