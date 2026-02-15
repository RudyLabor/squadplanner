
import { useState, useEffect, useCallback } from 'react'
import { m } from 'framer-motion'
import { ArrowRight, Menu, X as CloseIcon } from '../icons'
import { Link } from 'react-router'
import { SquadPlannerLogo } from '../SquadPlannerLogo'

const navLinks = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Comment ça marche', href: '#how-it-works' },
  { label: 'Témoignages', href: '#testimonials' },
  { label: 'FAQ', href: '/help', isRoute: true },
]

interface LandingNavbarProps {
  isLoggedIn: boolean
}

export function LandingNavbar({ isLoggedIn }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-3 transition-all duration-300 ${
          scrolled
            ? 'bg-bg-base/70 backdrop-blur-xl border-b border-border-subtle'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <nav
          className="max-w-5xl mx-auto flex items-center justify-between"
          aria-label="Navigation principale"
        >
          <Link to="/" className="flex items-center gap-2 shrink-0 min-h-[44px] min-w-[44px]" aria-label="Squad Planner - Accueil">
            <SquadPlannerLogo size={24} />
            <span className="text-md font-semibold text-text-primary hidden sm:inline" aria-hidden="true">
              Squad Planner
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-base text-text-tertiary hover:text-text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-base text-text-tertiary hover:text-text-primary transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {isLoggedIn ? (
              <Link
                to="/home"
                className="px-4 py-2 rounded-lg bg-primary text-white text-base md:text-md font-medium hover:bg-primary-hover transition-colors duration-300 inline-flex items-center"
              >
                Aller à l'app
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="hidden md:inline-flex items-center px-3 md:px-4 py-2 text-base md:text-md text-text-secondary hover:text-text-primary border border-border-subtle hover:border-border-hover rounded-lg transition-all"
                >
                  Se connecter
                </Link>
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="hidden md:inline-flex items-center px-3 md:px-4 py-2 rounded-lg bg-primary text-white text-base md:text-md font-medium hover:bg-primary-hover transition-colors duration-300"
                  data-track="navbar_cta_click"
                >
                  Créer ma squad
                  <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                </Link>
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="md:hidden inline-flex items-center px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium"
                  data-track="navbar_mobile_cta_click"
                >
                  S'inscrire
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary"
                  aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? (
                    <CloseIcon className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <m.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-40 bg-bg-base/95 backdrop-blur-xl flex flex-col pt-20 px-6"
        >
          <div className="flex flex-col gap-4 mb-8">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={closeMobileMenu}
                  className="text-lg text-text-primary font-medium py-2"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="text-lg text-text-primary font-medium py-2"
                >
                  {link.label}
                </a>
              )
            )}
          </div>
          <div className="flex flex-col gap-3">
            <Link
              to="/auth"
              onClick={closeMobileMenu}
              className="block w-full py-3 text-text-secondary border border-border-subtle rounded-xl text-center"
            >
              Se connecter
            </Link>
            <Link
              to="/auth?mode=register&redirect=onboarding"
              onClick={closeMobileMenu}
              className="block w-full py-3 bg-primary text-white rounded-xl font-medium text-center"
            >
              Créer ma squad gratuitement
            </Link>
          </div>
        </m.div>
      )}
    </>
  )
}
