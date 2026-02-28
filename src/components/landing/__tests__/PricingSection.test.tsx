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
}))

import { PricingSection } from '../PricingSection'

describe('PricingSection', () => {
  it('renders the section with correct aria-label', () => {
    render(<PricingSection />)
    expect(screen.getByLabelText('Tarifs')).toBeInTheDocument()
  })

  it('renders the title and subtitle', () => {
    render(<PricingSection />)
    expect(screen.getByText('Tarifs simples, sans surprise')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Commence gratuitement. Passe Premium quand tu veux débloquer tout le potentiel.'
      )
    ).toBeInTheDocument()
  })

  // --- Free Plan ---
  describe('Free Plan', () => {
    it('renders plan name and price', () => {
      render(<PricingSection />)
      expect(screen.getByText('Gratuit')).toBeInTheDocument()
      expect(screen.getByText('0€')).toBeInTheDocument()
    })

    it('renders the monthly suffix for free plan', () => {
      render(<PricingSection />)
      const priceSuffixes = screen.getAllByText('/mois')
      expect(priceSuffixes.length).toBe(2) // one for free, one for premium
    })

    it('renders free plan description', () => {
      render(<PricingSection />)
      expect(screen.getByText("Tout ce qu'il faut pour jouer avec ta squad.")).toBeInTheDocument()
    })

    it('renders all 6 free plan features', () => {
      render(<PricingSection />)
      const freeFeatures = [
        '2 squads gratuites',
        'Sessions avec confirmation',
        'Chat de squad',
        'Score de fiabilité',
        'Party vocale',
        'Notifications push',
      ]
      freeFeatures.forEach((feature) => {
        expect(screen.getByText(feature)).toBeInTheDocument()
      })
    })

    it('renders check icons for each free feature', () => {
      render(<PricingSection />)
      // 6 free + 7 premium = 13 check icons total
      const checkIcons = screen.getAllByTestId('check-icon')
      expect(checkIcons.length).toBe(13)
    })

    it('renders free plan CTA button with link to /auth', () => {
      render(<PricingSection />)
      const freeButton = screen.getByText("C'est parti — Gratuit")
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
      expect(screen.getByText('4,99€')).toBeInTheDocument()
    })

    it('renders POPULAIRE badge', () => {
      render(<PricingSection />)
      expect(screen.getByText('POPULAIRE')).toBeInTheDocument()
    })

    it('renders premium plan description', () => {
      render(<PricingSection />)
      expect(screen.getByText('Pour les squads qui veulent aller plus loin.')).toBeInTheDocument()
    })

    it('renders all 7 premium plan features', () => {
      render(<PricingSection />)
      const premiumFeatures = [
        'Tout le plan Gratuit',
        'Squads illimitées',
        'Coach IA avancé',
        'Qualité audio HD',
        'Historique illimité',
        'Stats avancées',
        'Badges exclusifs',
      ]
      premiumFeatures.forEach((feature) => {
        expect(screen.getByText(feature)).toBeInTheDocument()
      })
    })

    it('renders premium plan CTA button with link to /auth', () => {
      render(<PricingSection />)
      const premiumButton = screen.getByText('Débloquer Premium')
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
    it('has a 2-column grid for plans on md screens', () => {
      const { container } = render(<PricingSection />)
      const grid = container.querySelector('.grid.md\\:grid-cols-2')
      expect(grid).toBeInTheDocument()
    })

    it('contains exactly 2 Link elements pointing to /auth', () => {
      render(<PricingSection />)
      const links = screen.getAllByRole('link')
      const authLinks = links.filter((l) => l.getAttribute('href') === '/auth')
      expect(authLinks.length).toBe(2)
    })

    it('renders the section with proper container class', () => {
      const { container } = render(<PricingSection />)
      expect(container.querySelector('.max-w-4xl')).toBeInTheDocument()
    })
  })
})
