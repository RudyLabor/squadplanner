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
    { title: `Planifier des sessions ${game.name} - Squad Planner` },
    { name: 'description', content: game.seoDescription },
    { tagName: 'link', rel: 'canonical', href: `https://squadplanner.fr/games/${game.slug}` },
    { property: 'og:url', content: `https://squadplanner.fr/games/${game.slug}` },
    { property: 'og:title', content: `Planifier des sessions ${game.name}` },
    { property: 'og:description', content: game.seoDescription },
    {
      tagName: 'script',
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        name: game.name,
        description: game.description,
        genre: game.genre,
        url: `https://squadplanner.fr/games/${game.slug}`,
      }),
    },
    {
      tagName: 'script',
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `Comment planifier une session ${game.name} ?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Utilisez Squad Planner pour créer une session ${game.name}, inviter vos amis et gérer les RSVP automatiquement.`,
            },
          },
          {
            '@type': 'Question',
            name: `Comment trouver des joueurs ${game.name} ?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Activez le matchmaking Squad Planner pour recevoir des invitations de squads ${game.name} compatibles.`,
            },
          },
        ],
      }),
    },
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

const features = [
  {
    icon: Shield,
    title: 'RSVP fiable',
    desc: (name: string) =>
      `Confirmation et rappels automatiques. Votre squad ${name} ne vous laissera plus jamais tomber.`,
    details: ['Rappels 1h et 15min avant', 'Confirmation auto à seuil atteint', 'Score de fiabilité par joueur'],
  },
  {
    icon: Users,
    title: 'Matchmaking intelligent',
    desc: (name: string) =>
      `Trouvez des coéquipiers ${name} compatibles avec votre niveau et votre style de jeu.`,
    details: ['Matching par niveau & préférences', 'Communauté vérifiée', 'Profils détaillés'],
  },
  {
    icon: Calendar,
    title: 'Planning optimisé',
    desc: (name: string) =>
      `Créez une session ${name} en 30 secondes. Invitations, RSVP et stats au même endroit.`,
    details: ['Création en 30 secondes', 'Sessions récurrentes', 'Intégration calendrier'],
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
      q: `Comment planifier une session ${game.name} ?`,
      a: `Inscris-toi sur Squad Planner, crée une session ${game.name} en spécifiant le mode de jeu et l'heure. Invite tes amis via un lien. Squad Planner gère les RSVP et envoie un rappel avant le démarrage.`,
    },
    {
      q: `Comment trouver des joueurs ${game.name} fiables ?`,
      a: `Active le matchmaking dans ton profil. Notre système te met en contact avec des joueurs ayant le même style de jeu. Les profils vérifiés et scores de fiabilité t'aident à composer une squad de confiance.`,
    },
    {
      q: `Quels sont les avantages Premium pour ${game.name} ?`,
      a: `Premium donne accès aux sessions illimitées, stats avancées, personnalisation complète et visibilité accrue dans le matchmaking. Essai gratuit 7 jours.`,
    },
    {
      q: `Comment améliorer ma squad ${game.name} ?`,
      a: `Utilise les analytics Squad Planner pour identifier les forces et faiblesses de ton équipe. Recrute des joueurs complémentaires via le matchmaking et analyse les sessions passées.`,
    },
  ]

  const steps = [
    {
      step: '1',
      icon: Users,
      title: 'Crée ta squad',
      desc: `Donne un nom à ta squad ${game.shortName || game.name}. Invite tes potes avec un simple lien.`,
    },
    {
      step: '2',
      icon: Calendar,
      title: 'Planifie une session',
      desc: `Choisis le mode de jeu, la date et l'heure. Chacun répond OUI ou NON. Plus de "on verra".`,
    },
    {
      step: '3',
      icon: Target,
      title: 'Jouez ensemble',
      desc: `Rappels automatiques, check-in, et c'est parti ! Semaine après semaine, ta squad devient fiable.`,
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
            Planifie tes sessions
            <br />
            <span className="text-gradient-animated">{game.name}</span>
            <br />
            avec ta squad
          </m.h1>

          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
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
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="w-full sm:w-auto">
              <Link
                to="/auth?mode=register&redirect=onboarding"
                className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow w-full sm:w-auto justify-center"
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
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Comment ça marche
            </h2>
            <p className="text-text-tertiary text-lg">
              De la création de squad à la session {game.name} en 30 secondes
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

      {/* ── Features pillars ── */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Pourquoi Squad Planner pour {game.name} ?
            </h2>
            <p className="text-text-tertiary text-lg">
              Chaque fonctionnalité résout un problème précis des gamers {game.name}.
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
                          <FeatIcon className="w-6 h-6" style={{ color: gc }} />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary">{feat.title}</h3>
                      </div>
                      <p className="text-text-tertiary mb-4">{feat.desc(game.name)}</p>
                      <ul className="space-y-2">
                        {feat.details.map((detail) => (
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

      {/* ── FAQ ── */}
      <section className="px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-3xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
              Questions fréquentes sur {game.name}
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
                Prêt à planifier ta première session {game.shortName || game.name} ?
              </h2>
              <p className="text-text-tertiary mb-8 text-lg">
                Gratuit, sans engagement. Lance ta première session en 30 secondes.
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
                Gratuit · Pas de carte bancaire · 30 secondes
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
              Découvre aussi sur Squad Planner
            </h2>
            <p className="text-text-quaternary text-md">
              Organise tes sessions sur tous tes jeux favoris
            </p>
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
