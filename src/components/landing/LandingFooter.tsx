import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, FileText, Shield, Mail } from 'lucide-react'
import { SquadPlannerLogo } from '../SquadPlannerLogo'

export function LandingFooter() {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterError, setNewsletterError] = useState('')
  const [newsletterSuccess, setNewsletterSuccess] = useState(false)
  const [newsletterLoading, setNewsletterLoading] = useState(false)

  const handleNewsletterSubmit = useCallback(async (e: React.FormEvent) => {
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
      const { supabase } = await import('../../lib/supabase')
      const { error } = await supabase.from('newsletter').insert({ email: newsletterEmail })
      if (error) throw error
      setNewsletterSuccess(true)
      setNewsletterEmail('')
    } catch {
      setNewsletterError('Une erreur est survenue. Réessaie.')
    } finally {
      setNewsletterLoading(false)
    }
  }, [newsletterEmail])

  return (
    <footer className="px-4 md:px-6 py-16 border-t border-border-subtle">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Produit */}
          <div>
            <h3 className="text-base font-semibold text-text-primary mb-4 uppercase tracking-wider">Produit</h3>
            <ul className="space-y-0">
              <li><Link to="/auth?mode=register&redirect=onboarding" className="inline-block py-2 text-md text-text-tertiary hover:text-text-primary transition-colors min-h-[44px] leading-[28px]">Créer ma squad</Link></li>
              <li><Link to="/premium" className="inline-block py-2 text-md text-text-tertiary hover:text-text-primary transition-colors min-h-[44px] leading-[28px]">Premium</Link></li>
              <li><a href="#features" className="inline-block py-2 text-md text-text-tertiary hover:text-text-primary transition-colors min-h-[44px] leading-[28px]">Fonctionnalités</a></li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="text-base font-semibold text-text-primary mb-4 uppercase tracking-wider">Ressources</h3>
            <ul className="space-y-0">
              <li><Link to="/help" className="inline-flex items-center gap-1.5 py-2 text-md text-text-tertiary hover:text-text-primary transition-colors min-h-[44px]"><HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />FAQ</Link></li>
              <li><a href="mailto:contact@squadplanner.fr" className="inline-block py-2 text-md text-text-tertiary hover:text-text-primary transition-colors min-h-[44px] leading-[28px]">Contact</a></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-base font-semibold text-text-primary mb-4 uppercase tracking-wider">Légal</h3>
            <ul className="space-y-0">
              <li><Link to="/legal" className="inline-flex items-center gap-1.5 py-2 text-md text-text-tertiary hover:text-text-primary transition-colors min-h-[44px]"><FileText className="w-3.5 h-3.5" aria-hidden="true" />CGU</Link></li>
              <li><Link to="/legal?tab=privacy" className="inline-flex items-center gap-1.5 py-2 text-md text-text-tertiary hover:text-text-primary transition-colors min-h-[44px]"><Shield className="w-3.5 h-3.5" aria-hidden="true" />Confidentialité</Link></li>
            </ul>
          </div>

          {/* Communauté */}
          <div>
            <h3 className="text-base font-semibold text-text-primary mb-4 uppercase tracking-wider">Communauté</h3>
            <ul className="space-y-0">
              <li><span className="inline-flex items-center gap-1.5 py-2 text-md text-text-tertiary min-h-[44px]"><span className="w-2 h-2 rounded-full bg-success animate-pulse" />Beta ouverte</span></li>
              <li>
                <span className="inline-flex items-center gap-1.5 py-2 text-md text-text-quaternary min-h-[44px] cursor-default">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Twitter / X (bientôt)
                </span>
              </li>
              <li><a href="mailto:contact@squadplanner.fr" className="inline-block py-2 text-md text-text-tertiary hover:text-text-primary transition-colors min-h-[44px] leading-[28px]">Nous contacter</a></li>
            </ul>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {[
            { label: 'Hébergé en France', icon: '🇫🇷' },
            { label: 'RGPD compliant', icon: '🛡️' },
            { label: 'Données chiffrées', icon: '🔒' },
          ].map(badge => (
            <span key={badge.label} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card border border-border-subtle text-sm text-text-tertiary">
              {badge.icon} {badge.label}
            </span>
          ))}
        </div>

        {/* Newsletter */}
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
                  onChange={(e) => { setNewsletterEmail(e.target.value); setNewsletterError(''); setNewsletterSuccess(false) }}
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
            {newsletterError && <p role="alert" className="text-error text-sm mt-1.5">{newsletterError}</p>}
            {newsletterSuccess && <p role="status" className="text-success text-sm mt-1.5">Merci ! Tu recevras nos updates.</p>}
          </form>
        </div>

        {/* Bottom bar */}
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
