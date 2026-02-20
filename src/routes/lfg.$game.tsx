import type { HeadersArgs } from 'react-router'
import { useParams, Link } from 'react-router'
import { m } from 'framer-motion'
import { getGameBySlug } from '../data/games'
import { Users, ArrowRight, Sparkles, Star } from '../components/icons'

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
    { title: `Chercher des joueurs ${game.name} - Squad Planner` },
    {
      name: 'description',
      content: `Trouvez des joueurs ${game.name} fiables et formez une squad complète avec Squad Planner. Matchmaking intelligent et communauté vérifiée.`,
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: `https://squadplanner.fr/lfg/${game.slug}`,
    },
    { property: 'og:url', content: `https://squadplanner.fr/lfg/${game.slug}` },
    { property: 'og:title', content: `Chercher des joueurs ${game.name}` },
    { property: 'og:description', content: `Trouvez des joueurs ${game.name} et formez votre squad parfaite.` },
  ]
}

function GameNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-base to-surface-card flex flex-col items-center justify-center px-4">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
  )
}

function StepCard({
  number,
  title,
  description,
  icon: Icon,
  delay,
  color,
}: {
  number: number
  title: string
  description: string
  icon: React.ComponentType<any>
  delay: number
  color: string
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative"
    >
      <div className="bg-surface-card border border-border-subtle rounded-2xl p-8 h-full">
        <div className="flex items-start gap-6">
          <div className={`w-16 h-16 bg-${color}/10 rounded-xl flex items-center justify-center flex-shrink-0`}>
            <div className={`text-3xl font-bold text-${color}`}>{number}</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Icon className={`w-6 h-6 text-${color}`} />
              <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
            </div>
            <p className="text-text-secondary">{description}</p>
          </div>
        </div>
      </div>
    </m.div>
  )
}

function BenefitCard({
  title,
  description,
  icon: Icon,
  delay,
}: {
  title: string
  description: string
  icon: React.ComponentType<any>
  delay: number
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-surface-card border border-border-subtle rounded-xl p-6"
    >
      <div className="flex items-start gap-4">
        <Icon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-semibold text-text-primary mb-2">{title}</h4>
          <p className="text-text-secondary text-sm">{description}</p>
        </div>
      </div>
    </m.div>
  )
}

export default function Component() {
  const { game: gameSlug } = useParams()
  const game = gameSlug ? getGameBySlug(gameSlug) : undefined

  if (!game) {
    return <GameNotFound />
  }

  const colorClass = game.color

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-base via-surface-card to-bg-base">
      {/* Hero Section */}
      <m.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-bg-${colorClass}-15 to-transparent`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-6xl mb-4">{game.icon}</div>
            <h1 className="text-5xl sm:text-6xl font-bold text-text-primary mb-4 leading-tight">
              Chercher des joueurs{' '}
              <span className={`text-${colorClass}`}>{game.name}</span>
            </h1>
            <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
              Rejoignez une communauté de {game.estimatedPlayers} joueurs {game.name} fiables et organisez vos sessions avec des coéquipiers compatibles.
            </p>

            {/* Quick Stats */}
            <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className={`text-4xl font-bold text-${colorClass} mb-2`}>
                  {game.estimatedPlayers.split('+')[0]}M+
                </div>
                <div className="text-text-secondary text-sm">Joueurs actifs</div>
              </m.div>
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className={`text-4xl font-bold text-${colorClass} mb-2`}>
                  24/7
                </div>
                <div className="text-text-secondary text-sm">Matchmaking actif</div>
              </m.div>
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className={`text-4xl font-bold text-${colorClass} mb-2`}>
                  100%
                </div>
                <div className="text-text-secondary text-sm">Vérifiés</div>
              </m.div>
            </div>
          </div>
        </div>
      </m.section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-text-primary text-center mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-text-secondary text-center mb-16 max-w-2xl mx-auto">
            3 étapes simples pour trouver ta squad {game.name} idéale.
          </p>

          <div className="space-y-6">
            <StepCard
              number={1}
              title="Active ta recherche"
              description={`Créez votre profil Squad Planner et activez la recherche de coéquipiers ${game.name}. Configurez vos préférences : niveau, mode de jeu, plateforme et horaires.`}
              icon={Users}
              delay={0.1}
              color={colorClass}
            />
            <StepCard
              number={2}
              title="Configure tes préférences"
              description={`Indiquez votre rôle préféré, votre niveau de compétitivité et vos disponibilités. Squad Planner utilise ces infos pour vous matcher avec les joueurs les plus compatibles.`}
              icon={Star}
              delay={0.2}
              color={colorClass}
            />
            <StepCard
              number={3}
              title="Reçois des invitations"
              description={`Squad Planner vous recommande des joueurs et des squads ${game.name}. Acceptez les invitations, rejoignez des sessions et construisez votre communauté de confiance.`}
              icon={Sparkles}
              delay={0.3}
              color={colorClass}
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface-card/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-text-primary text-center mb-16">
            Avantages de Squad Planner
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <BenefitCard
              title="Communauté vérifiée"
              description={`Tous les joueurs Squad Planner sont vérifiés. Pas de smurf, pas de troll. Jouez avec confiance avec une vraie communauté ${game.name}.`}
              icon={Users}
              delay={0.1}
            />
            <BenefitCard
              title="Matchmaking intelligent"
              description={`Notre IA apprend de vos préférences et de votre historique pour vous proposer les meilleurs coéquipiers ${game.name}.`}
              icon={Star}
              delay={0.2}
            />
            <BenefitCard
              title="Planification facile"
              description={`Planifiez vos sessions ${game.name} en quelques clics. Gestion des RSVP, rappels automatiques et statistiques de squad.`}
              icon={Users}
              delay={0.3}
            />
            <BenefitCard
              title="Analyse et progression"
              description={`Suivez vos performances ${game.name}, les statistiques de votre squad et progressez ensemble avec des données objectives.`}
              icon={Star}
              delay={0.4}
            />
            <BenefitCard
              title="Disponible 24/7"
              description={`Le matchmaking ${game.name} fonctionne toute la journée. Trouvez des joueurs à l'heure qui vous convient.`}
              icon={Users}
              delay={0.5}
            />
            <BenefitCard
              title="Support communauté"
              description={`Accédez à un support prioritaire, des événements communautaires exclusifs et des discussions entre joueurs ${game.name}.`}
              icon={Star}
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-text-primary text-center mb-16">
            Ce que disent les joueurs {game.name}
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Alex T.',
                role: `Joueur ${game.name}`,
                text: `"J'ai enfin trouvé une squad fiable ! Plus besoin de chercher des joueurs désorganisés."`,
                delay: 0.1,
              },
              {
                name: 'Marie L.',
                role: `Compétitrice ${game.name}`,
                text: `"Squad Planner m'a aidé à trouver des coéquipiers de mon niveau. Nous progressons ensemble."`,
                delay: 0.2,
              },
              {
                name: 'Jordan M.',
                role: `Capitaine de squad`,
                text: `"Organiser nos sessions est devenu tellement plus facile. Tout le monde arrive à l'heure !"`,
                delay: 0.3,
              },
            ].map((testimonial, idx) => (
              <m.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: testimonial.delay }}
                className="bg-surface-card border border-border-subtle rounded-xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-text-secondary mb-4 italic">"{testimonial.text}"</p>
                <div className="border-t border-border-subtle pt-4">
                  <p className="font-semibold text-text-primary">{testimonial.name}</p>
                  <p className="text-sm text-text-tertiary">{testimonial.role}</p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <m.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-${colorClass}/10 to-transparent`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <m.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-4xl font-bold text-text-primary mb-6">
                Rejoins la communauté {game.name}
              </h2>
              <p className="text-text-secondary mb-8 text-lg">
                Accédez au matchmaking Squad Planner et trouvez vos coéquipiers {game.name} idéaux dès maintenant. C'est gratuit pour commencer.
              </p>
              <div className="space-y-3">
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className={`flex items-center justify-center gap-2 px-8 py-4 bg-${colorClass} text-white font-semibold rounded-xl hover:bg-${colorClass}/90 transition-all transform hover:scale-105 w-full`}
                >
                  <Sparkles className="w-5 h-5" />
                  Rejoindre maintenant
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/auth?mode=login&redirect=profile?activate=matchmaking"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-surface-card border border-border-subtle text-text-primary font-semibold rounded-xl hover:border-border-default transition-colors w-full"
                >
                  Activer le matchmaking
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </m.div>

            <m.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className={`bg-surface-card border border-border-subtle rounded-2xl p-8`}
            >
              <div className="text-center">
                <div className="text-6xl mb-6">{game.icon}</div>
                <h3 className="text-2xl font-bold text-text-primary mb-4">
                  Prêt à joueur avec ta squad {game.name} ?
                </h3>
                <div className={`bg-${colorClass}/10 rounded-xl p-6 mt-6`}>
                  <p className="text-sm text-text-secondary mb-3">
                    Rejoignez les joueurs {game.name} qui ont trouvé leur squad idéale
                  </p>
                  <div className={`text-3xl font-bold text-${colorClass}`}>
                    {game.estimatedPlayers}
                  </div>
                  <p className="text-xs text-text-tertiary mt-2">joueurs actifs</p>
                </div>
              </div>
            </m.div>
          </div>
        </div>
      </m.section>

      {/* FAQ Quick Links */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-border-subtle">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-text-secondary mb-6">
            Vous avez des questions sur le matchmaking {game.name} ?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/help" className="text-primary hover:underline font-semibold">
              Consulter l'aide
            </Link>
            <span className="hidden sm:block text-border-subtle">•</span>
            <Link to="/premium" className="text-primary hover:underline font-semibold">
              Découvrir Premium
            </Link>
            <span className="hidden sm:block text-border-subtle">•</span>
            <Link to={`/games/${game.slug}`} className="text-primary hover:underline font-semibold">
              Planifier une session
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-surface-card/30">
        <div className="max-w-6xl mx-auto text-center text-text-tertiary text-sm">
          <p>Squad Planner · Cherche des joueurs {game.name} · Planifie tes sessions · Grimpe avec ta squad</p>
        </div>
      </section>
    </div>
  )
}
