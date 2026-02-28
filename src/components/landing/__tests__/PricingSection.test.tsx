import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  LazyMotion: ({ children }: any) => children,
  MotionConfig: ({ children }: any) => children,
  domAnimation: {},
  domMax: {},
  useInView: vi.fn().mockReturnValue(true),
  useScroll: vi.fn().mockReturnValue({ scrollYProgress: { get: () => 0 } }),
  useTransform: vi.fn().mockReturnValue(0),
  useMotionValue: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn(), on: vi.fn() }),
  useSpring: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn() }),
  useAnimate: vi.fn().mockReturnValue([{ current: null }, vi.fn()]),
  useAnimation: vi.fn().mockReturnValue({ start: vi.fn(), stop: vi.fn() }),
  useReducedMotion: vi.fn().mockReturnValue(false),
  m: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
  motion: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
}))

vi.mock('../../icons', () => ({
  Check: (props: any) => createElement('span', { ...props, 'data-testid': 'check-icon' }, 'check'),
  Crown: (props: any) => createElement('span', { ...props, 'data-testid': 'crown-icon' }, 'crown'),
}))

import { PricingSection } from '../PricingSection'

describe('PricingSection', () => {
  it('renders the section with correct aria-label', () => {
    render(<PricingSection />)
    expect(screen.getByLabelText('Tarifs')).toBeInTheDocument()
  })

  it('renders the title and subtitle', () => {
    render(<PricingSection />)
    expect(
      screen.getByText(/Choisis ton plan/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Le gratuit suffit pour organiser tes sessions/)
    ).toBeInTheDocument()
  })

  // --- Free Plan ---
  describe('Free Plan', () => {
    it('renders plan name and price', () => {
      render(<PricingSection />)
      expect(screen.getByText('Gratuit')).toBeInTheDocument()
      expect(screen.getByText(/0\.00/)).toBeInTheDocument()
    })

    it('renders the monthly suffix for all plans', () => {
      render(<PricingSection />)
      const priceSuffixes = screen.getAllByText('/mois')
      expect(priceSuffixes.length).toBe(5) // one per tier (Gratuit, Premium, Squad Leader, Clan, Club)
    })

    it('renders free plan description', () => {
      render(<PricingSection />)
      expect(screen.getByText("L'essentiel pour organiser tes sessions.")).toBeInTheDocument()
    })

    it('renders all 6 free plan features', () => {
      render(<PricingSection />)
      const freeFeatures = [
        '1 squad · 5 membres max',
        '2 sessions/semaine',
        'Historique 7 jours',
        'Chat basique',
        'Score de fiabilité',
        'Notifications push',
      ]
      freeFeatures.forEach((feature) => {
        expect(screen.getByText(feature)).toBeInTheDocument()
      })
    })

    it('renders check icons for each feature across all tiers', () => {
      render(<PricingSection />)
      // 6 free + 8 premium + 9 squad leader + 6 clan + 8 club = 37 check icons total
      const checkIcons = screen.getAllByTestId('check-icon')
      expect(checkIcons.length).toBe(37)
    })

    it('renders free plan CTA button with link to /auth', () => {
      render(<PricingSection />)
      const freeButton = screen.getByText('Commencer gratuitement')
      expect(freeButton).toBeInTheDocument()
      const link = freeButton.closest('a')
      expect(link).toHaveAttribute('href', '/auth')
    })
  })

  // --- Premium Plan ---
  describe('Premium Plan', () => {
    it('renders plan name and price', () => {
      render(<PricingSection />)
      expect(screen.getByText('Premium')).toBeInTheDocument()
    })

    it('renders RECOMMANDÉ badge on Premium tier', () => {
      render(<PricingSection />)
      expect(screen.getByText('RECOMMANDÉ')).toBeInTheDocument()
    })

    it('renders premium plan description', () => {
      render(<PricingSection />)
      expect(screen.getByText('Pour les squads qui jouent sérieusement.')).toBeInTheDocument()
    })

    it('renders all 8 premium plan features', () => {
      render(<PricingSection />)
      const premiumFeatures = [
        '5 squads',
        'Sessions illimitées',
        'Historique 90 jours',
        'Chat complet (GIF, voice, polls)',
        'Heatmaps de présence et tendances',
        'IA Coach basique',
        'Badge Premium violet',
        'Zéro pub',
      ]
      premiumFeatures.forEach((feature) => {
        expect(screen.getByText(feature)).toBeInTheDocument()
      })
    })

    it('renders premium plan CTA button with link to /auth', () => {
      render(<PricingSection />)
      const premiumButton = screen.getByText('Passer Premium — 6,99€/mois')
      expect(premiumButton).toBeInTheDocument()
      const link = premiumButton.closest('a')
      expect(link).toHaveAttribute('href', '/auth')
    })
  })

  // --- Trust badges ---
  describe('Trust badges', () => {
    it('renders all 4 trust badges', () => {
      render(<PricingSection />)
      expect(screen.getByText('Données hébergées en France')).toBeInTheDocument()
      expect(screen.getByText('Chiffrement SSL')).toBeInTheDocument()
      expect(screen.getByText('Conforme RGPD')).toBeInTheDocument()
      expect(screen.getByText('Paiement sécurisé Stripe')).toBeInTheDocument()
    })

    it('trust badges contain SVG icons', () => {
      const { container } = render(<PricingSection />)
      // Each trust badge has an SVG icon
      const trustBadgeSvgs = container.querySelectorAll('svg.w-4.h-4')
      expect(trustBadgeSvgs.length).toBe(4)
    })

    it('SVG icons have correct attributes', () => {
      const { container } = render(<PricingSection />)
      const svgs = container.querySelectorAll('svg.w-4.h-4')
      svgs.forEach((svg) => {
        expect(svg.getAttribute('fill')).toBe('none')
        expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
        expect(svg.getAttribute('stroke')).toBe('currentColor')
      })
    })
  })

  // --- Layout / Structure ---
  describe('Layout structure', () => {
    it('has a grid for plans with responsive columns', () => {
      const { container } = render(<PricingSection />)
      const grid = container.querySelector('.grid.md\\:grid-cols-2')
      expect(grid).toBeInTheDocument()
    })

    it('contains exactly 5 Link elements pointing to /auth', () => {
      render(<PricingSection />)
      const links = screen.getAllByRole('link')
      const authLinks = links.filter((l) => l.getAttribute('href') === '/auth')
      expect(authLinks.length).toBe(5)
    })

    it('renders the section with proper container class', () => {
      const { container } = render(<PricingSection />)
      expect(container.querySelector('.max-w-6xl')).toBeInTheDocument()
    })
  })
})
