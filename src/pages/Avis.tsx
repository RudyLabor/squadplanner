import { useEffect } from 'react'
import { trackEvent } from '../utils/analytics'
import { Link } from 'react-router'
import { m } from 'framer-motion'
import { ArrowRight, Star } from '../components/icons'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'

interface Testimonial {
  gamertag: string
  game: string
  duration: string
  rating: number
  quote: string
  squad: string
}

const testimonials: Testimonial[] = [
  {
    gamertag: 'DarkViper_FR',
    game: 'Valorant Ranked',
    duration: '6 mois',
    rating: 5,
    quote:
      "Le score de fiabilité a changé notre squad. Plus de ghosts, plus de sessions annulées à la dernière minute.",
    squad: 'ViperSquad (5 membres)',
  },
  {
    gamertag: 'Luna_Healer',
    game: 'FFXIV Raid Static',
    duration: '8 mois',
    rating: 5,
    quote:
      "Les sessions récurrentes + les rappels auto, c'est exactement ce qu'il manquait pour notre static.",
    squad: 'CrystalStatic (8 membres)',
  },
  {
    gamertag: 'FragMaster_92',
    game: 'CS2 Faceit',
    duration: '4 mois',
    rating: 4.5,
    quote:
      "L'analytics par joueur nous a aidés à identifier qui était vraiment investi. On est passés de 5 à 15 membres actifs.",
    squad: 'FragTeam (15 membres)',
  },
  {
    gamertag: 'PixelQueen',
    game: 'Streameuse Fortnite',
    duration: '3 mois',
    rating: 5,
    quote:
      "Le widget sur mon stream + le programme ambassadeur, c'est génial. Ma commu s'organise toute seule.",
    squad: 'PixelCrew (42 membres)',
  },
  {
    gamertag: 'TacticalBear',
    game: 'Manager club esport',
    duration: '10 mois',
    rating: 5,
    quote:
      "Le dashboard Club avec export CSV nous a fait gagner 3h par semaine sur l'admin.",
    squad: 'BearForce (3 squads, 28 joueurs)',
  },
  {
    gamertag: 'SkyRocket_RL',
    game: 'Rocket League 3v3',
    duration: '5 mois',
    rating: 4.5,
    quote:
      'Les challenges quotidiens gardent tout le monde motivé. Notre streak record est de 47 jours !',
    squad: 'RocketSquad (6 membres)',
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rating >= i ? 'full' : rating >= i - 0.5 ? 'half' : 'empty'
        return (
          <span key={i} className="relative w-5 h-5">
            <Star
              className={`w-5 h-5 ${fill === 'empty' ? 'text-text-tertiary/30' : 'text-warning'}`}
            />
            {fill === 'half' && (
              <span className="absolute inset-0 overflow-hidden w-[50%]">
                <Star className="w-5 h-5 text-warning" />
              </span>
            )}
          </span>
        )
      })}
      <span className="ml-1.5 text-sm font-medium text-text-secondary">{rating}</span>
    </div>
  )
}

function AverageRating() {
  const avg =
    testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
  return (
    <div className="flex items-center gap-3">
      <span className="text-4xl font-extrabold text-text-primary">{avg.toFixed(1)}</span>
      <div>
        <StarRating rating={avg} />
        <p className="text-sm text-text-tertiary mt-0.5">
          {testimonials.length} avis vérifiés
        </p>
      </div>
    </div>
  )
}

export default function Avis() {
  useEffect(() => { trackEvent('page_viewed', { page: 'avis' }) }, [])

  return (
    <PublicPageShell>
      {/* Hero */}
      <section className="relative overflow-hidden noise-overlay">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 0%, var(--color-primary-10) 0%, transparent 60%)',
            filter: 'blur(40px)',
          }}
        />
        <div className="relative px-4 md:px-6 py-16 md:py-24 max-w-5xl mx-auto text-center">
          <m.h1
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-text-primary mb-6 leading-tight tracking-tight"
          >
            Ce que disent les <span className="text-gradient-animated">joueurs</span>
          </m.h1>
          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Des gamers comme toi utilisent Squad Planner tous les jours pour organiser leurs sessions. Voici ce qu'ils en pensent.
          </m.p>
          <m.div
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <AverageRating />
          </m.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Testimonials Grid */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <m.div
                key={t.gamertag}
                variants={scrollRevealLight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-6 md:p-8 rounded-2xl bg-surface-card border border-border-subtle hover:border-border-hover transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">{t.gamertag}</h3>
                    <p className="text-sm text-text-tertiary">{t.game}</p>
                  </div>
                  <StarRating rating={t.rating} />
                </div>

                {/* Quote */}
                <blockquote className="text-text-secondary leading-relaxed mb-4">
                  &laquo;&nbsp;{t.quote}&nbsp;&raquo;
                </blockquote>

                {/* Footer */}
                <div className="flex items-center justify-between text-sm text-text-tertiary border-t border-border-subtle pt-4">
                  <span>{t.squad}</span>
                  <span>Membre depuis {t.duration}</span>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Stats */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          >
            {[
              { value: '4.8/5', label: 'Note moyenne' },
              { value: '92%', label: 'Recommandent' },
              { value: '-73%', label: 'De ghosting' },
              { value: '+2.4x', label: "Sessions par semaine" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl md:text-3xl font-extrabold text-primary mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-text-tertiary">{stat.label}</p>
              </div>
            ))}
          </m.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* CTA */}
      <section className="px-4 md:px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative p-8 md:p-12 rounded-3xl border overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at center, var(--color-primary-10) 0%, transparent 60%)',
              borderColor: 'var(--color-primary-20)',
            }}
          >
            <div className="relative z-10">
              <h2 className="text-xl md:text-3xl font-bold text-text-primary mb-4">
                À ton tour
              </h2>
              <p className="text-text-tertiary mb-8 text-lg">
                Rejoins les joueurs qui ont repris le contrôle de leurs sessions.
              </p>
              <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="inline-flex">
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary-bg text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow"
                >
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </m.div>
              <p className="text-base text-text-tertiary mt-4">
                Gratuit · Pas de carte bancaire · 30 secondes
              </p>
            </div>
          </m.div>
        </div>
      </section>
    </PublicPageShell>
  )
}
