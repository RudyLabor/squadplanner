
import { useState, useCallback } from 'react'
import { Link } from 'react-router'
import { HelpCircle, FileText, Shield, Mail, Gamepad2, Globe, Trophy } from '../icons'
import { SquadPlannerLogo } from '../SquadPlannerLogo'

const POPULAR_GAMES = [
  { name: 'Valorant', slug: 'valorant' },
  { name: 'League of Legends', slug: 'league-of-legends' },
  { name: 'Fortnite', slug: 'fortnite' },
  { name: 'CS2', slug: 'cs2' },
  { name: 'Apex Legends', slug: 'apex-legends' },
  { name: 'Rocket League', slug: 'rocket-league' },
  { name: 'Call of Duty', slug: 'call-of-duty' },
  { name: 'Minecraft', slug: 'minecraft' },
  { name: 'Overwatch 2', slug: 'overwatch-2' },
  { name: 'GTA Online', slug: 'gta-online' },
  { name: 'Destiny 2', slug: 'destiny-2' },
  { name: 'EA Sports FC', slug: 'fifa' },
]

const linkClass =
  'inline-block py-1.5 text-md text-text-tertiary hover:text-text-primary transition-colors leading-relaxed'

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
    <footer className="px-4 md:px-6 py-16 border-t border-border-subtle">
      <div className="max-w-6xl mx-auto">

        {/* ── Top grid: 6 columns on desktop ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-10 mb-14">

          {/* Produit */}
          <div>
            <h3 className="text-base font-semibold text-text-primary mb-3 uppercase tracking-wider">
              Produit
            </h3>
            <ul className="space-y-0">
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
                <a href="#features" className={linkClass}>
                  Fonctionnalités
                </a>
              </li>
            </ul>
          </div>

          {/* Jeux populaires — colonne 1 */}
          <div>
            <h3 className="text-base font-semibold text-text-primary mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5" aria-hidden="true" />
              Jeux
            </h3>
            <ul className="space-y-0">
              {POPULAR_GAMES.slice(0, 6).map((game) => (
                <li key={game.slug}>
                  <Link to={`/games/${game.slug}`} className={linkClass}>
                    {game.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Jeux populaires — colonne 2 */}
          <div>
            <h3 className="text-base font-semibold text-text-primary mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
              LFG
            </h3>
            <ul className="space-y-0">
              {POPULAR_GAMES.slice(6).map((game) => (
                <li key={game.slug}>
                  <Link to={`/lfg/${game.slug}`} className={linkClass}>
                    {game.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Alternatives & Comparatifs */}
          <div>
            <h3 className="text-base font-semibold text-text-primary mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              Alternatives
            </h3>
            <ul className="space-y-0">
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
                <Link to="/blog" className={linkClass}>
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="text-base font-semibold text-text-primary mb-3 uppercase tracking-wider">
              Ressources
            </h3>
            <ul className="space-y-0">
              <li>
                <Link
                  to="/help"
                  className="inline-flex items-center gap-1.5 py-1.5 text-md text-text-tertiary hover:text-text-primary transition-colors"
                >
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
                <Link to="/ambassador" className={linkClass}>
                  Programme Ambassadeur
                </Link>
              </li>
              <li>
                <a href="mailto:contact@squadplanner.fr" className={linkClass}>
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Légal & Communauté */}
          <div>
            <h3 className="text-base font-semibold text-text-primary mb-3 uppercase tracking-wider">
              Légal
            </h3>
            <ul className="space-y-0">
              <li>
                <Link
                  to="/legal"
                  className="inline-flex items-center gap-1.5 py-1.5 text-md text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  CGU
                </Link>
              </li>
              <li>
                <Link
                  to="/legal?tab=privacy"
                  className="inline-flex items-center gap-1.5 py-1.5 text-md text-text-tertiary hover:text-text-primary transition-colors"
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
                  className="inline-flex items-center gap-1.5 py-1.5 text-md text-text-tertiary hover:text-text-primary transition-colors"
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
                <span className="inline-flex items-center gap-1.5 py-1.5 text-md text-text-tertiary">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Accès gratuit
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Trust badges ── */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {[
            { label: 'Hébergé en France', icon: '🇫🇷' },
            { label: 'RGPD compliant', icon: '🛡️' },
            { label: 'Données chiffrées', icon: '🔒' },
          ].map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card border border-border-subtle text-sm text-text-tertiary"
            >
              {badge.icon} {badge.label}
            </span>
          ))}
        </div>

        {/* ── Activity stats ── */}
        <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm text-text-quaternary">
          <span>+2 000 gamers inscrits</span>
          <span>+5 000 sessions planifiées</span>
          <span>4.9/5 satisfaction</span>
        </div>

        {/* ── Newsletter ── */}
        <div className="max-w-md mx-auto mb-10">
          <form onSubmit={handleNewsletterSubmit} noValidate>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-quaternary" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Reçois les updates Squad Planner"
                  className="w-full pl-10 pr-4 py-2.5 bg-bg-elevated border border-border-subtle rounded-lg text-md text-text-primary placeholder:text-text-quaternary focus:border-primary focus:outline-none transition-colors"
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
                className="px-5 min-h-[44px] bg-primary text-white text-md font-medium rounded-lg hover:bg-primary-hover transition-colors shrink-0 disabled:opacity-60"
              >
                {newsletterLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "S'abonner"
                )}
              </button>
            </div>
            {newsletterError && (
              <p role="alert" className="text-error text-sm mt-1.5">
                {newsletterError}
              </p>
            )}
            {newsletterSuccess && (
              <p role="status" className="text-success text-sm mt-1.5">
                Merci ! Tu recevras nos updates.
              </p>
            )}
          </form>
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-border-subtle pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SquadPlannerLogo size={20} />
            <div>
              <span className="text-md font-semibold text-text-primary">Squad Planner</span>
              <span className="text-sm text-text-quaternary ml-2">Le Calendly du gaming</span>
            </div>
          </div>
          <p className="text-base text-text-quaternary">
            © 2026 Squad Planner. Jouez ensemble, pour de vrai.
          </p>
        </div>
      </div>
    </footer>
  )
}
