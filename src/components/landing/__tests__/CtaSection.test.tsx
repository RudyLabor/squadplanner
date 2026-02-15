import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  m: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
  motion: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
}))

vi.mock('../../icons', () => ({
  ArrowRight: (props: any) => createElement('span', { ...props, 'data-testid': 'arrow-icon' }, 'arrow'),
  Sparkles: (props: any) => createElement('span', { ...props, 'data-testid': 'sparkles-icon' }, 'sparkles'),
}))

vi.mock('../../../utils/animations', () => ({
  springTap: { whileTap: { scale: 0.97 } },
}))

import { CtaSection } from '../CtaSection'

describe('CtaSection', () => {
  it('renders section with correct aria-label', () => {
    render(<CtaSection />)
    expect(screen.getByLabelText("Appel à l'action")).toBeInTheDocument()
  })

  it('renders the heading', () => {
    render(<CtaSection />)
    expect(screen.getByText('Prêt à jouer vraiment ?')).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    render(<CtaSection />)
    expect(
      screen.getByText('Gratuit, sans engagement. Lance ta première session en 30 secondes.')
    ).toBeInTheDocument()
  })

  describe('Sparkles icon', () => {
    it('renders the Sparkles icon', () => {
      render(<CtaSection />)
      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument()
    })

    it('Sparkles icon has aria-hidden="true"', () => {
      render(<CtaSection />)
      expect(screen.getByTestId('sparkles-icon')).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('CTA button/link', () => {
    it('renders the CTA text', () => {
      render(<CtaSection />)
      expect(screen.getByText('Créer ma squad maintenant')).toBeInTheDocument()
    })

    it('CTA link points to registration page', () => {
      render(<CtaSection />)
      const link = screen.getByText('Créer ma squad maintenant').closest('a')
      expect(link).toHaveAttribute('href', '/auth?mode=register&redirect=onboarding')
    })

    it('CTA link has tracking attribute', () => {
      render(<CtaSection />)
      const link = screen.getByText('Créer ma squad maintenant').closest('a')
      expect(link).toHaveAttribute('data-track', 'bottom_cta_click')
    })

    it('renders ArrowRight icon in CTA', () => {
      render(<CtaSection />)
      expect(screen.getByTestId('arrow-icon')).toBeInTheDocument()
    })

    it('CTA link has glow animation class', () => {
      render(<CtaSection />)
      const link = screen.getByText('Créer ma squad maintenant').closest('a')
      expect(link?.className).toContain('cta-glow-idle')
    })
  })

  describe('Trust indicators', () => {
    it('renders the trust line below CTA', () => {
      render(<CtaSection />)
      expect(
        screen.getByText('Gratuit · Pas de carte bancaire · 30 secondes')
      ).toBeInTheDocument()
    })
  })

  describe('Contact link', () => {
    it('renders the contact link', () => {
      render(<CtaSection />)
      expect(screen.getByText('Une question ? Contacte-nous')).toBeInTheDocument()
    })

    it('contact link points to mailto', () => {
      render(<CtaSection />)
      const contactLink = screen.getByText('Une question ? Contacte-nous')
      expect(contactLink.closest('a')).toHaveAttribute('href', 'mailto:contact@squadplanner.fr')
    })

    it('contact link has minimum touch target height', () => {
      render(<CtaSection />)
      const contactLink = screen.getByText('Une question ? Contacte-nous').closest('a')
      expect(contactLink?.className).toContain('min-h-[44px]')
    })
  })

  describe('Layout structure', () => {
    it('has max-w-2xl container', () => {
      const { container } = render(<CtaSection />)
      expect(container.querySelector('.max-w-2xl')).toBeInTheDocument()
    })

    it('has center-aligned text', () => {
      const { container } = render(<CtaSection />)
      expect(container.querySelector('.text-center')).toBeInTheDocument()
    })

    it('has gradient background', () => {
      const { container } = render(<CtaSection />)
      const gradientDiv = container.querySelector('.bg-gradient-to-b')
      expect(gradientDiv).toBeInTheDocument()
    })
  })
})
