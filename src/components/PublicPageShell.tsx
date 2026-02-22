/**
 * PublicPageShell — Wrapper partagé pour toutes les pages publiques SEO.
 * Inclut LandingNavbar + LandingFooter + classes landing-page/landing-noise.
 * Assure la cohérence visuelle avec la landing page principale.
 */

import type { ReactNode } from 'react'
import { LandingNavbar } from './landing/LandingNavbar'
import { LandingFooter } from './landing/LandingFooter'

interface PublicPageShellProps {
  children: ReactNode
  /** Extra classes for the outer wrapper */
  className?: string
}

export function PublicPageShell({ children, className = '' }: PublicPageShellProps) {
  return (
    <div className={`min-h-screen bg-bg-base landing-page landing-noise ${className}`}>
      <LandingNavbar isLoggedIn={false} />
      {/* pt-16 to offset fixed navbar */}
      <main className="pt-16">{children}</main>
      <LandingFooter />
    </div>
  )
}
