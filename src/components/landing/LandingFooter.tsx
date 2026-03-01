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
  'inline-block py-1.5 text-base text-text-tertiary hover:text-primary transition-colors duration-200 leading-relaxed'

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
            <span className="text-sm font-medium text-primary">+2{' '}000 gamers s'organisent déjà</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-text-primary mb-2">
            Sois le premier informé
          </h3>
          <p className="text-base text-text-tertiary mb-6 max-w-md mx-auto">
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
                  className="w-full pl-10 pr-4 py-3 bg-surface-card/50 backdrop-blur-sm border border-border-subtle rounded-xl text-base text-text-primary placeholder:text-text-quaternary focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
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
                className="px-5 min-h-[48px] bg-primary-bg text-white text-base font-semibold rounded-xl hover:bg-primary-bg-hover transition-colors shrink-0 disabled:opacity-60 flex items-center gap-2"
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
                Merci ! Tu recevras nos actus.
              </p>
            )}
          </form>
        </div>
      </div>

      {/* ── Zone 2 : Grille de liens (5 colonnes) ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 md:gap-x-12 gap-y-10">
          {/* Produit */}
          <div>
            <p className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-normal md:tracking-wider flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              Produit
            </p>
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

          {/* Fonctionnalités */}
          <div>
            <p className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-normal md:tracking-wider">
              Fonctionnalités
            </p>
            <ul className="space-y-0.5">
              <li>
                <Link to="/how-it-works" className={linkClass}>
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link to="/features/score-fiabilite" className={linkClass}>
                  Score de fiabilité
                </Link>
              </li>
              <li>
                <Link to="/features/gamification" className={linkClass}>
                  Gamification
                </Link>
              </li>
              <li>
                <Link to="/features/coach-ia" className={linkClass}>
                  Coach IA
                </Link>
              </li>
              <li>
                <Link to="/features/analytics" className={linkClass}>
                  Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Jeux populaires */}
          <div>
            <p className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-normal md:tracking-wider flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              Jeux populaires
            </p>
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
            <p className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-normal md:tracking-wider">
              Ressources
            </p>
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
                <Link to="/vs/discord-vs-squad-planner" className={linkClass}>
                  Discord vs Squad Planner
                </Link>
              </li>
              <li>
                <Link to="/vs/google-calendar-vs-squad-planner" className={linkClass}>
                  Google Calendar vs SP
                </Link>
              </li>
              <li>
                <Link to="/glossaire" className={linkClass}>
                  Glossaire gaming
                </Link>
              </li>
              <li>
                <Link to="/avis" className={linkClass}>
                  Avis joueurs
                </Link>
              </li>
              <li>
                <Link to="/solutions/clubs-esport" className={linkClass}>
                  Clubs esport
                </Link>
              </li>
              <li>
                <Link to="/solutions/streamers" className={linkClass}>
                  Streamers
                </Link>
              </li>
              <li>
                <Link to="/contact" className={linkClass}>
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal & Communauté */}
          <div>
            <p className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-normal md:tracking-wider">
              Communauté
            </p>
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
              <li>
                <a
                  href="https://discord.gg/squadplanner"
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
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Discord
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
            { label: 'Hébergé en France', icon: '🇫🇷' },
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

        {/* App Store badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-card/50 backdrop-blur-sm border border-border-subtle text-sm text-text-secondary">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83"/><path d="M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/></svg>
            Bientôt sur iOS
          </span>
          <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-card/50 backdrop-blur-sm border border-border-subtle text-sm text-text-secondary">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.523 2.234l-1.964 3.39A9.96 9.96 0 0 0 12 4.96a9.96 9.96 0 0 0-3.559.663L6.477 2.234a.424.424 0 0 0-.728.432l1.94 3.354A10.007 10.007 0 0 0 2 15h20a10.007 10.007 0 0 0-5.689-8.98l1.94-3.354a.424.424 0 0 0-.728-.432zM8 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm8 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM2 16h20v1a7 7 0 0 1-7 7H9a7 7 0 0 1-7-7v-1z"/></svg>
            Bientôt sur Android
          </span>
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
              <span className="text-base font-semibold text-text-primary">Squad Planner</span>
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
