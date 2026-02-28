import { useState, useCallback } from 'react'
import { Link } from 'react-router'
import { HelpCircle, FileText, Shield, Mail, Gamepad2, ArrowRight, Crown, Users } from '../icons'
import { SquadPlannerLogo } from '../SquadPlannerLogo'

const FOOTER_GAMES = [
  { name: 'Valorant', slug: 'valorant', icon: '🎯' },
  { name: 'League of Legends', slug: 'league-of-legends', icon: '⚔️' },
  { name: 'Fortnite', slug: 'fortnite', icon: '🏗️' },
  { name: 'CS2', slug: 'cs2', icon: '💣' },
  { name: 'Apex Legends', slug: 'apex-legends', icon: '🔥' },
  { name: 'Call of Duty', slug: 'call-of-duty', icon: '🎖️' },
]

const linkClass =
  'inline-block py-1.5 text-md text-text-tertiary hover:text-primary transition-colors duration-200 leading-relaxed'

export function LandingFooter() {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterError, setNewsletterError] = useState('')
  const [newsletterSuccess, setNewsletterSuccess] = useState(false)
  const [newsletterLoading, setNewsletterLoading] = useState(false)

  const handleNewsletterSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setNewsletterError('')
      setNewsletterSuccess(false)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!newsletterEmail.trim() || !emailRegex.test(newsletterEmail)) {
        setNewsletterError('Email invalide')
        return
      }
      setNewsletterLoading(true)
      try {
        const { supabase } = await import('../../lib/supabaseMinimal')
        const { error } = await supabase.from('newsletter').insert({ email: newsletterEmail })
        if (error) throw error
        setNewsletterSuccess(true)
        setNewsletterEmail('')
      } catch {
        setNewsletterError('Une erreur est survenue. Réessaie.')
      } finally {
        setNewsletterLoading(false)
      }
    },
    [newsletterEmail]
  )

  return (
    <footer className="relative">
      {/* ── Gradient separator ── */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      {/* ── Zone 1 : Newsletter CTA premium ── */}
      <div className="bg-gradient-to-b from-primary/[0.04] to-transparent">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full badge-shimmer border border-primary/20 mb-5">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-medium text-primary">+2{'\u00a0'}000 gamers s'organisent déjà</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-text-primary mb-2">
            Sois le premier informé
          </h3>
          <p className="text-md text-text-tertiary mb-6 max-w-md mx-auto">
            Nouveaux jeux, astuces et mises à jour. Max 2 emails/mois. Zéro spam.
          </p>
          <form onSubmit={handleNewsletterSubmit} noValidate className="max-w-md mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-quaternary group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="ton@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-surface-card/50 backdrop-blur-sm border border-border-subtle rounded-xl text-md text-text-primary placeholder:text-text-quaternary focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
                  aria-label="Adresse email pour la newsletter"
                  value={newsletterEmail}
                  onChange={(e) => {
                    setNewsletterEmail(e.target.value)
                    setNewsletterError('')
                    setNewsletterSuccess(false)
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={newsletterLoading}
                className="px-5 min-h-[48px] bg-primary-bg text-white text-md font-semibold rounded-xl hover:bg-primary-bg-hover transition-colors shrink-0 disabled:opacity-60 flex items-center gap-2"
              >
                {newsletterLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    S'abonner
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            {newsletterError && (
              <p role="alert" className="text-error text-sm mt-2">
                {newsletterError}
              </p>
            )}
            {newsletterSuccess && (
              <p role="status" className="text-success text-sm mt-2">
                Merci\u00a0! Tu recevras nos actus.
              </p>
            )}
          </form>
        </div>
      </div>

      {/* ── Zone 2 : Grille de liens (4 colonnes) ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-10">
          {/* Produit */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              Produit
            </h3>
            <ul className="space-y-0.5">
              <li>
                <Link to="/auth?mode=register&redirect=onboarding" className={linkClass}>
                  Créer ma squad
                </Link>
              </li>
              <li>
                <Link to="/premium" className={linkClass}>
                  Premium
                </Link>
              </li>
              <li>
                <Link to="/#features" className={linkClass}>
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link to="/ambassador" className={linkClass}>
                  Programme Ambassadeur
                </Link>
              </li>
            </ul>
          </div>

          {/* Jeux populaires */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              Jeux populaires
            </h3>
            <ul className="space-y-0.5">
              {FOOTER_GAMES.map((game) => (
                <li key={game.slug}>
                  <Link to={`/games/${game.slug}`} className={linkClass}>
                    <span className="mr-1.5" aria-hidden="true">
                      {game.icon}
                    </span>
                    {game.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
              Ressources
            </h3>
            <ul className="space-y-0.5">
              <li>
                <Link to="/help" className={`${linkClass} inline-flex items-center gap-1.5`}>
                  <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/blog" className={linkClass}>
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/alternative/guilded" className={linkClass}>
                  Alternative à Guilded
                </Link>
              </li>
              <li>
                <Link to="/alternative/gamerlink" className={linkClass}>
                  Alternative à GamerLink
                </Link>
              </li>
              <li>
                <Link to="/alternative/discord-events" className={linkClass}>
                  Alternative à Discord Events
                </Link>
              </li>
              <li>
                <Link to="/vs/guilded-vs-squad-planner" className={linkClass}>
                  Guilded vs Squad Planner
                </Link>
              </li>
              <li>
                <a href="mailto:contact@squadplanner.fr" className={linkClass}>
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
              Légal
            </h3>
            <ul className="space-y-0.5">
              <li>
                <Link to="/legal" className={`${linkClass} inline-flex items-center gap-1.5`}>
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  CGU
                </Link>
              </li>
              <li>
                <Link
                  to="/legal?tab=privacy"
                  className={`${linkClass} inline-flex items-center gap-1.5`}
                >
                  <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                  Confidentialité
                </Link>
              </li>
              <li>
                <a
                  href="https://x.com/squadplannerfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} inline-flex items-center gap-1.5`}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Twitter / X
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Gradient separator ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />
      </div>

      {/* ── Zone 3 : Bottom bar premium ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Trust badges glassmorphiques */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {[
            { label: 'Hébergé en Europe (UE)', icon: '🇪🇺' },
            { label: 'Conforme au RGPD', icon: '🛡️' },
            { label: 'Données chiffrées', icon: '🔒' },
          ].map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-card/50 backdrop-blur-sm border border-border-subtle text-sm text-text-secondary"
            >
              {badge.icon} {badge.label}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm text-text-tertiary">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            +2 000 gamers inscrits
          </span>
          <span>+5 000 sessions planifiées</span>
          <span>4.9/5 satisfaction</span>
        </div>

        {/* Logo + copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <SquadPlannerLogo size={22} />
            <div>
              <span className="text-md font-semibold text-text-primary">Squad Planner</span>
              <span className="text-sm text-text-tertiary ml-2">Le Calendly du gaming</span>
            </div>
          </div>
          <p className="text-sm text-text-quaternary">
            © 2026 Squad Planner. Joue avec ta squad, pour de vrai.
          </p>
        </div>
      </div>
    </footer>
  )
}
