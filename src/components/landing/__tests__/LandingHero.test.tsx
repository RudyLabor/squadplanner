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
  ArrowRight: (props: any) =>
    createElement('span', { ...props, 'data-testid': 'icon-arrow' }, 'arrow'),
  Sparkles: (props: any) =>
    createElement('span', { ...props, 'data-testid': 'icon-sparkles' }, 'sparkles'),
}))

vi.mock('../../../utils/animations', () => ({ springTap: {} }))

vi.mock('../HeroMockup', () => ({
  HeroMockup: () => createElement('div', { 'data-testid': 'hero-mockup' }, 'HeroMockup'),
}))

import { LandingHero } from '../LandingHero'

const mockMotionValue = { get: () => 0, set: vi.fn(), on: vi.fn(), destroy: vi.fn() } as any

const defaultProps = {
  isLoggedIn: false,
  isDesktop: true,
  mouseRotateX: mockMotionValue,
  mouseRotateY: mockMotionValue,
  heroRotateX: mockMotionValue,
  heroRotateY: mockMotionValue,
}

describe('LandingHero', () => {
  // ─── Basic rendering ────────────────────────────────────

  it('renders main element with id "main-content"', () => {
    const { container } = render(<LandingHero {...defaultProps} />)
    expect(container.querySelector('#main-content')).toBeTruthy()
  })

  it('renders main with aria-label "Accueil"', () => {
    render(<LandingHero {...defaultProps} />)
    expect(screen.getByLabelText('Accueil')).toBeInTheDocument()
  })

  it('renders Sparkles icon', () => {
    render(<LandingHero {...defaultProps} />)
    expect(screen.getByTestId('icon-sparkles')).toBeInTheDocument()
  })

  it('renders badge text', () => {
    render(<LandingHero {...defaultProps} />)
    expect(screen.getByText('Rassemble ta squad et jouez ensemble')).toBeInTheDocument()
  })

  it('renders h1 heading with expected text', () => {
    render(<LandingHero {...defaultProps} />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/Arrête de perdre/)).toBeInTheDocument()
    expect(screen.getByText(/soirées gaming/)).toBeInTheDocument()
    expect(screen.getByText(/joue enfin avec ta squad/)).toBeInTheDocument()
  })

  it('renders description text', () => {
    render(<LandingHero {...defaultProps} />)
    expect(
      screen.getByText(/Tes potes confirment en 2 clics/)
    ).toBeInTheDocument()
    expect(screen.getByText(/Tu joues ce soir/)).toBeInTheDocument()
  })

  it('renders HeroMockup', () => {
    render(<LandingHero {...defaultProps} />)
    expect(screen.getByTestId('hero-mockup')).toBeInTheDocument()
  })

  // ─── Hero stats ────────────────────────────────────────

  it('renders all 3 hero stats', () => {
    render(<LandingHero {...defaultProps} />)
    expect(screen.getByText('Gratuit')).toBeInTheDocument()
    expect(screen.getByText('sans piège')).toBeInTheDocument()
    expect(screen.getByText('30s')).toBeInTheDocument()
    expect(screen.getByText('chrono pour ta squad')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('ghosting toléré')).toBeInTheDocument()
  })

  it('renders bottom text note', () => {
    render(<LandingHero {...defaultProps} />)
    expect(screen.getByText(/2\u00a0000 gamers/)).toBeInTheDocument()
    expect(screen.getByText(/rejoins-les/)).toBeInTheDocument()
  })

  // ─── Logged out: CTA buttons ───────────────────────────

  it('renders "Créer ma squad — c'est gratuit" CTA when logged out', () => {
    render(<LandingHero {...defaultProps} />)
    expect(screen.getByText('Créer ma squad — c'est gratuit')).toBeInTheDocument()
  })

  it('renders CTA with data-track attribute', () => {
    render(<LandingHero {...defaultProps} />)
    const cta = screen.getByText('Créer ma squad — c'est gratuit').closest('a')
    expect(cta?.getAttribute('data-track')).toBe('hero_cta_click')
  })

  it('renders CTA with correct register link', () => {
    render(<LandingHero {...defaultProps} />)
    const cta = screen.getByText('Créer ma squad — c'est gratuit').closest('a')
    expect(cta?.getAttribute('href')).toBe('/auth?mode=register&redirect=onboarding')
  })

  it('renders ArrowRight icon in CTA', () => {
    render(<LandingHero {...defaultProps} />)
    expect(screen.getAllByTestId('icon-arrow').length).toBeGreaterThanOrEqual(1)
  })

  it('renders "Comment ça marche" secondary CTA when logged out', () => {
    render(<LandingHero {...defaultProps} />)
    expect(screen.getByText('Comment ça marche')).toBeInTheDocument()
  })

  it('secondary CTA links to #how-it-works', () => {
    render(<LandingHero {...defaultProps} />)
    const link = screen.getByText('Comment ça marche').closest('a')
    expect(link?.getAttribute('href')).toBe('#how-it-works')
  })

  it('secondary CTA has data-track attribute', () => {
    render(<LandingHero {...defaultProps} />)
    const link = screen.getByText('Comment ça marche').closest('a')
    expect(link?.getAttribute('data-track')).toBe('hero_secondary_cta_click')
  })

  it('renders "Déjà un compte ?" login link when logged out', () => {
    render(<LandingHero {...defaultProps} />)
    expect(screen.getByText(/Déjà un compte/)).toBeInTheDocument()
    expect(screen.getByText(/Se connecter/)).toBeInTheDocument()
  })

  it('login link points to /auth', () => {
    render(<LandingHero {...defaultProps} />)
    const loginLink = screen.getByText(/Déjà un compte/).closest('a')
    expect(loginLink?.getAttribute('href')).toBe('/auth')
  })

  // ─── Logged in: app link ───────────────────────────────

  it('renders "Accéder à mes squads" when logged in', () => {
    render(<LandingHero {...{ ...defaultProps, isLoggedIn: true }} />)
    expect(screen.getByText('Accéder à mes squads')).toBeInTheDocument()
  })

  it('app link points to /home when logged in', () => {
    render(<LandingHero {...{ ...defaultProps, isLoggedIn: true }} />)
    const link = screen.getByText('Accéder à mes squads').closest('a')
    expect(link?.getAttribute('href')).toBe('/home')
  })

  it('app link has data-track attribute', () => {
    render(<LandingHero {...{ ...defaultProps, isLoggedIn: true }} />)
    const link = screen.getByText('Accéder à mes squads').closest('a')
    expect(link?.getAttribute('data-track')).toBe('hero_cta_click')
  })

  it('does NOT render "Créer ma squad" when logged in', () => {
    render(<LandingHero {...{ ...defaultProps, isLoggedIn: true }} />)
    expect(screen.queryByText('Créer ma squad — c'est gratuit')).not.toBeInTheDocument()
  })

  it('does NOT render "Comment ça marche" CTA when logged in', () => {
    render(<LandingHero {...{ ...defaultProps, isLoggedIn: true }} />)
    expect(screen.queryByText('Comment ça marche')).not.toBeInTheDocument()
  })

  it('does NOT render "Déjà un compte" link when logged in', () => {
    render(<LandingHero {...{ ...defaultProps, isLoggedIn: true }} />)
    expect(screen.queryByText(/Déjà un compte/)).not.toBeInTheDocument()
  })

  // ─── Desktop vs mobile parallax ────────────────────────

  it('renders with isDesktop=true (uses mouseRotateX/Y)', () => {
    // This is a render test - the motion values are passed to m.div style
    const { container } = render(<LandingHero {...defaultProps} />)
    expect(container.querySelector('#main-content')).toBeTruthy()
  })

  it('renders with isDesktop=false (uses heroRotateX/Y)', () => {
    const { container } = render(<LandingHero {...{ ...defaultProps, isDesktop: false }} />)
    expect(container.querySelector('#main-content')).toBeTruthy()
  })

  // ─── ArrowRight appears in logged in view too ──────────

  it('renders ArrowRight icon in logged-in CTA', () => {
    render(<LandingHero {...{ ...defaultProps, isLoggedIn: true }} />)
    expect(screen.getAllByTestId('icon-arrow').length).toBeGreaterThanOrEqual(1)
  })

  // ─── Background elements ───────────────────────────────

  it('renders mesh gradient background', () => {
    const { container } = render(<LandingHero {...defaultProps} />)
    expect(container.querySelector('.mesh-gradient-hero')).toBeTruthy()
  })

  it('renders noise overlay class', () => {
    const { container } = render(<LandingHero {...defaultProps} />)
    expect(container.querySelector('.noise-overlay')).toBeTruthy()
  })

  // ─── Gradient animated text ────────────────────────────

  it('renders gradient animated text for "tes soirées gaming"', () => {
    const { container } = render(<LandingHero {...defaultProps} />)
    const gradientSpan = container.querySelector('.text-gradient-animated')
    expect(gradientSpan).toBeTruthy()
    expect(gradientSpan?.textContent).toContain('tes soirées gaming')
  })
})
