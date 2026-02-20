import { useState } from 'react'
import type { HeadersArgs } from 'react-router'
import { useParams, Link } from 'react-router'
import { m } from 'framer-motion'
import { getGameBySlug, GAMES } from '../data/games'
import { PublicPageShell } from '../components/PublicPageShell'
import {
  Calendar,
  Users,
  Shield,
  Star,
  ChevronDown,
  ArrowRight,
  Sparkles,
} from '../components/icons'

// Color mapping for dynamic styling
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
      {
        name: 'description',
        content: 'Ce jeu n\'existe pas ou n\'est pas encore disponible sur Squad Planner.',
      },
    ]
  }

  return [
    { title: `Planifier des sessions ${game.name} - Squad Planner` },
    {
      name: 'description',
      content: game.seoDescription,
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: `https://squadplanner.fr/games/${game.slug}`,
    },
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
              text: `Utilisez Squad Planner pour créer une session ${game.name}, définir le mode de jeu et inviter vos amis. Notre système automatique confirme les RSVP et gère votre squad.`,
            },
          },
          {
            '@type': 'Question',
            name: `Comment trouver des joueurs ${game.name} ?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Activez le matchmaking dans votre profil pour recevoir des invitations de squads ${game.name} compatibles. Squad Planner vous met en contact avec des joueurs fiables.`,
            },
          },
          {
            '@type': 'Question',
            name: `Est-ce gratuit de planifier sur Squad Planner ?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Oui, les fonctionnalités essentielles sont gratuites. Optez pour Premium pour débloquer squads illimitées et analyses avancées.`,
            },
          },
        ],
      }),
    },
  ]
}

function GameNotFound() {
  return (
    <PublicPageShell>
      <div className="flex flex-col items-center justify-center px-4 py-32">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-text-primary mb-4">Jeu non trouvé</h1>
          <p className="text-text-secondary mb-8">
            Ce jeu n\'existe pas ou n\'est pas encore disponible sur Squad Planner.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            Retour à l\'accueil
            <ArrowRight className="w-5 h-5" />
          </Link>
        </m.div>
      </div>
    </PublicPageShell>
  )
}

function GameAccordion({
  title,
  content,
  isOpen,
  onToggle,
}: {
  title: string
  content: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full text-left p-6 bg-surface-card border border-border-subtle rounded-xl hover:border-border-default transition-colors"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-semibold text-text-primary text-lg">{title}</h3>
        <m.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-text-secondary flex-shrink-0" />
        </m.div>
      </div>
      <m.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <p className="text-text-secondary mt-4">{content}</p>
      </m.div>
    </button>
  )
}

export default function Component() {
  const { game: gameSlug } = useParams()
  const game = gameSlug ? getGameBySlug(gameSlug) : undefined

  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null)

  if (!game) {
    return <GameNotFound />
  }

  const faqs = [
    {
      title: `Comment planifier une session ${game.name} ?`,
      content: `Inscrivez-vous sur Squad Planner, créez une nouvelle session ${game.name} en spécifiant le mode de jeu, l'heure et le nombre de joueurs. Invitez vos amis ou laissez d'autres joueurs vous rejoindre. Squad Planner gère les RSVP et vous envoie un rappel avant le démarrage.`,
    },
    {
      title: `Comment trouver des joueurs ${game.name} fiables ?`,
      content: `Activez le matchmaking dans votre profil Squad Planner. Notre système vous mettra en contact avec des joueurs ayant le même style de jeu. Les profils vérifiés et les avis d'autres joueurs vous aident à composer une squad de confiance.`,
    },
    {
      title: `Quels sont les avantages Premium pour ${game.name} ?`,
      content: `Premium vous donne accès à un nombre illimité de sessions ${game.name}, des analyses de statistiques avancées, la personnalisation complète de votre squad, et une visibilité accrue auprès d'autres joueurs. Essayez gratuitement pendant 7 jours.`,
    },
    {
      title: `Comment puis-je améliorer ma squad ${game.name} ?`,
      content: `Utilisez les analyses Squad Planner pour identifier les points forts et faibles de votre équipe. Recrutez des joueurs complémentaires via le matchmaking, et analysez les sessions passées pour améliorer votre stratégie.`,
    },
  ]

  return (
    <PublicPageShell>
      {/* Hero Section */}
      <m.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom, ${getGameColor(game.color)}15, transparent)`,
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">{game.icon}</div>
            <h1 className="text-5xl sm:text-6xl font-bold text-text-primary mb-6 leading-tight">
              Planifier des sessions{' '}
              <span style={{ color: getGameColor(game.color) }}>{game.name}</span> avec
              Squad Planner
            </h1>
            <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
              {game.description}
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/auth?mode=register&redirect=onboarding"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-purple text-white text-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
              >
                <Sparkles className="w-5 h-5" />
                Créer ma squad {game.shortName || game.name}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to={`/lfg/${game.slug}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-surface-card border border-border-subtle text-text-primary font-semibold hover:border-border-default transition-colors"
              >
                <Users className="w-5 h-5" />
                Chercher des joueurs
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <m.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-surface-card border border-border-subtle rounded-2xl p-6"
            >
              <div className="text-sm text-text-secondary mb-2">Genre</div>
              <div className="text-2xl font-semibold text-text-primary">{game.genre}</div>
            </m.div>
            <m.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-surface-card border border-border-subtle rounded-2xl p-6"
            >
              <div className="text-sm text-text-secondary mb-2">Mode de jeu</div>
              <div className="text-2xl font-semibold text-text-primary">{game.players}</div>
            </m.div>
            <m.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-surface-card border border-border-subtle rounded-2xl p-6"
            >
              <div className="text-sm text-text-secondary mb-2">Plateformes</div>
              <div className="text-lg font-semibold text-text-primary">
                {game.platforms.join(', ')}
              </div>
            </m.div>
          </div>

          <p className="text-center text-text-tertiary text-sm">
            {game.estimatedPlayers} sur {game.platforms.join(' • ')}
          </p>
        </div>
      </m.section>

      {/* Section Divider */}
      <div className="section-divider" />

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-text-primary text-center mb-16">
            Pourquoi Squad Planner pour {game.name} ?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: RSVP Reliability */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-surface-card border border-border-subtle rounded-2xl p-8"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: `${getGameColor(game.color)}15` }}
              >
                <Shield className="w-7 h-7" style={{ color: getGameColor(game.color) }} />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">RSVP Fiable</h3>
              <p className="text-text-secondary">
                Nos systèmes de confirmation et de rappels garantissent que votre squad ne vous
                laissera jamais tomber. Plus de No-Show avec Squad Planner.
              </p>
            </m.div>

            {/* Feature 2: Matchmaking */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-surface-card border border-border-subtle rounded-2xl p-8"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: `${getGameColor(game.color)}15` }}
              >
                <Users className="w-7 h-7" style={{ color: getGameColor(game.color) }} />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">
                Matchmaking Intelligent
              </h3>
              <p className="text-text-secondary">
                Trouvez des coéquipiers {game.name} compatibles avec votre niveau et votre style.
                Notre IA apprend de vos préférences pour de meilleures recommandations.
              </p>
            </m.div>

            {/* Feature 3: Planning */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-surface-card border border-border-subtle rounded-2xl p-8"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: `${getGameColor(game.color)}15` }}
              >
                <Calendar className="w-7 h-7" style={{ color: getGameColor(game.color) }} />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">
                Planification Facile
              </h3>
              <p className="text-text-secondary">
                Créez une session {game.name} en 30 secondes. Gérez vos événements, invitations
                et statistiques depuis un seul endroit.
              </p>
            </m.div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="section-divider" />

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface-card/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-text-primary text-center mb-16">
            Questions fréquentes sur {game.name}
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <m.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <GameAccordion
                  title={faq.title}
                  content={faq.content}
                  isOpen={openFAQIndex === index}
                  onToggle={() =>
                    setOpenFAQIndex(openFAQIndex === index ? null : index)
                  }
                />
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="section-divider" />

      {/* CTA Section */}
      <m.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-20"
        style={{
          background: `radial-gradient(135% 135% at 50% 0%, ${getGameColor(game.color)}20, transparent), linear-gradient(180deg, ${getGameColor(game.color)}10, transparent)`,
          boxShadow: `0 0 60px ${getGameColor(game.color)}20`,
        }}
      >
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold text-text-primary mb-6">
            Prêt à planifier ta première session {game.name} ?
          </h2>
          <p className="text-text-secondary mb-8 text-lg">
            Rejoins des milliers de joueurs {game.name} qui utilisent Squad Planner pour organiser
            leurs sessions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth?mode=register&redirect=onboarding"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white font-semibold rounded-xl hover:opacity-90 transition-all transform hover:scale-105"
              style={{ backgroundColor: getGameColor(game.color) }}
            >
              <Sparkles className="w-5 h-5" />
              Créer ma première session {game.name}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-surface-card border border-border-subtle text-text-primary font-semibold rounded-xl hover:border-border-default transition-colors"
            >
              En savoir plus
            </Link>
          </div>
        </div>
      </m.section>

      {/* Section Divider */}
      <div className="section-divider" />

      {/* Other Games Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
            Découvre aussi sur Squad Planner
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {GAMES
              .filter((g) => g.slug !== game.slug)
              .slice(0, 8)
              .map((g) => (
                <Link
                  key={g.slug}
                  to={`/games/${g.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-card border border-border-subtle rounded-xl text-text-secondary hover:text-text-primary hover:border-border-default transition-colors text-sm"
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
