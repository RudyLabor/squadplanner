import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
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
  Menu: (props: any) => createElement('span', { ...props, 'data-testid': 'icon-menu' }, 'menu'),
  X: (props: any) => createElement('span', { ...props, 'data-testid': 'icon-close' }, 'x'),
}))

vi.mock('../../SquadPlannerLogo', () => ({
  SquadPlannerLogo: () => createElement('span', { 'data-testid': 'sp-logo' }, 'Logo'),
}))

import { LandingNavbar } from '../LandingNavbar'

describe('LandingNavbar', () => {
  beforeEach(() => {
    // Reset scrollY
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
  })

  // ─── Basic rendering (logged out) ──────────────────────

  it('renders the header element', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('renders navigation with correct aria-label', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    expect(screen.getByLabelText('Navigation principale')).toBeInTheDocument()
  })

  it('renders SquadPlannerLogo', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    expect(screen.getByTestId('sp-logo')).toBeInTheDocument()
  })

  it('renders "Squad Planner" brand text', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    expect(screen.getByText('Squad Planner')).toBeInTheDocument()
  })

  it('renders home link to /', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    const logoLink = screen.getByTestId('sp-logo').closest('a')
    expect(logoLink?.getAttribute('href')).toBe('/')
  })

  // ─── Nav links (desktop) ───────────────────────────────

  it('renders all 4 navigation links', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    expect(screen.getByText('Fonctionnalités')).toBeInTheDocument()
    expect(screen.getByText('Comment ça marche')).toBeInTheDocument()
    expect(screen.getByText('Témoignages')).toBeInTheDocument()
    expect(screen.getByText('FAQ')).toBeInTheDocument()
  })

  it('renders anchor links for hash-based nav', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    const fonctLink = screen.getByText('Fonctionnalités').closest('a')
    expect(fonctLink?.getAttribute('href')).toBe('#features')
  })

  it('renders FAQ as a route link (to /help)', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    const faqLinks = screen.getAllByText('FAQ')
    // FAQ exists in desktop nav and mobile menu (when open)
    const faqDesktopLink = faqLinks[0].closest('a')
    expect(faqDesktopLink?.getAttribute('href')).toBe('/help')
  })

  // ─── Logged out: CTA buttons ───────────────────────────

  it('renders "Se connecter" link when logged out', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    expect(screen.getByText('Se connecter')).toBeInTheDocument()
  })

  it('renders "Créer ma squad — gratuit" CTA with ArrowRight icon', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    expect(screen.getByText(/Créer ma squad — gratuit$/)).toBeInTheDocument()
    // ArrowRight icon next to CTA
    expect(screen.getAllByTestId('icon-arrow').length).toBeGreaterThanOrEqual(1)
  })

  it('renders register link with correct href', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    const ctaLink = screen.getByText(/Créer ma squad — gratuit$/).closest('a')
    expect(ctaLink?.getAttribute('href')).toBe('/auth?mode=register&redirect=onboarding')
  })

  it('renders "Créer ma squad — gratuit" with data-track attribute', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    const ctaLink = screen.getByText(/Créer ma squad — gratuit$/).closest('a')
    expect(ctaLink?.getAttribute('data-track')).toBe('navbar_cta_click')
  })

  it('renders mobile "C\'est parti" CTA', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    expect(screen.getByText("C'est parti")).toBeInTheDocument()
  })

  it('renders mobile CTA with data-track attribute', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    const mobileCta = screen.getByText("C'est parti").closest('a')
    expect(mobileCta?.getAttribute('data-track')).toBe('navbar_mobile_cta_click')
  })

  // ─── Logged in: app link ───────────────────────────────

  it('renders "Aller à l\'app" link when logged in', () => {
    render(<LandingNavbar isLoggedIn={true} />)
    expect(screen.getByText("Aller à l'app")).toBeInTheDocument()
  })

  it('app link points to /home', () => {
    render(<LandingNavbar isLoggedIn={true} />)
    const appLink = screen.getByText("Aller à l'app").closest('a')
    expect(appLink?.getAttribute('href')).toBe('/home')
  })

  it('does NOT render "Se connecter" when logged in', () => {
    render(<LandingNavbar isLoggedIn={true} />)
    expect(screen.queryByText('Se connecter')).not.toBeInTheDocument()
  })

  it('does NOT render "Créer ma squad" when logged in', () => {
    render(<LandingNavbar isLoggedIn={true} />)
    expect(screen.queryByText(/Créer ma squad/)).not.toBeInTheDocument()
  })

  it('does NOT render hamburger menu when logged in', () => {
    render(<LandingNavbar isLoggedIn={true} />)
    expect(screen.queryByLabelText('Ouvrir le menu')).not.toBeInTheDocument()
  })

  // ─── Mobile menu toggle ────────────────────────────────

  it('renders hamburger button with "Ouvrir le menu" label', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    const btn = screen.getByLabelText('Ouvrir le menu')
    expect(btn).toBeInTheDocument()
    expect(btn.getAttribute('aria-expanded')).toBe('false')
  })

  it('shows Menu icon when menu is closed', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    const btn = screen.getByLabelText('Ouvrir le menu')
    expect(btn.querySelector('[data-testid="icon-menu"]')).toBeTruthy()
  })

  it('opens mobile menu on hamburger click', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    fireEvent.click(screen.getByLabelText('Ouvrir le menu'))
    // Mobile menu should now show "Créer ma squad — c'est gratuit"
    expect(screen.getByText('Créer ma squad — c'est gratuit')).toBeInTheDocument()
  })

  it('changes aria-label and aria-expanded when menu opens', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    fireEvent.click(screen.getByLabelText('Ouvrir le menu'))
    const closeBtn = screen.getByLabelText('Fermer le menu')
    expect(closeBtn.getAttribute('aria-expanded')).toBe('true')
  })

  it('shows Close icon when menu is open', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    fireEvent.click(screen.getByLabelText('Ouvrir le menu'))
    const closeBtn = screen.getByLabelText('Fermer le menu')
    expect(closeBtn.querySelector('[data-testid="icon-close"]')).toBeTruthy()
  })

  it('closes mobile menu on toggle click', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    fireEvent.click(screen.getByLabelText('Ouvrir le menu'))
    expect(screen.getByText('Créer ma squad — c'est gratuit')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Fermer le menu'))
    expect(screen.queryByText('Créer ma squad — c'est gratuit')).not.toBeInTheDocument()
  })

  // ─── Mobile menu content ───────────────────────────────

  it('mobile menu renders all nav links', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    fireEvent.click(screen.getByLabelText('Ouvrir le menu'))

    // Each link appears twice: desktop + mobile
    const foncts = screen.getAllByText('Fonctionnalités')
    expect(foncts.length).toBe(2)
  })

  it('mobile menu renders "Se connecter" and "Créer ma squad — c'est gratuit"', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    fireEvent.click(screen.getByLabelText('Ouvrir le menu'))

    // "Se connecter" appears in desktop + mobile
    const connectLinks = screen.getAllByText('Se connecter')
    expect(connectLinks.length).toBe(2)

    expect(screen.getByText('Créer ma squad — c'est gratuit')).toBeInTheDocument()
  })

  it('mobile menu "Se connecter" links to /auth', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    fireEvent.click(screen.getByLabelText('Ouvrir le menu'))

    const connectLinks = screen.getAllByText('Se connecter')
    connectLinks.forEach((link) => {
      expect(link.closest('a')?.getAttribute('href')).toBe('/auth')
    })
  })

  it('mobile menu "Créer ma squad — c'est gratuit" links to registration', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    fireEvent.click(screen.getByLabelText('Ouvrir le menu'))

    const ctaLink = screen.getByText('Créer ma squad — c'est gratuit').closest('a')
    expect(ctaLink?.getAttribute('href')).toBe('/auth?mode=register&redirect=onboarding')
  })

  // ─── Mobile menu closes on link click ──────────────────

  it('closes mobile menu when a nav link is clicked', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    fireEvent.click(screen.getByLabelText('Ouvrir le menu'))
    expect(screen.getByText('Créer ma squad — c'est gratuit')).toBeInTheDocument()

    // Click on a mobile menu link (second occurrence is the mobile one)
    const fonctLinks = screen.getAllByText('Fonctionnalités')
    fireEvent.click(fonctLinks[1])

    expect(screen.queryByText('Créer ma squad — c'est gratuit')).not.toBeInTheDocument()
  })

  it('closes mobile menu when "Se connecter" is clicked', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    fireEvent.click(screen.getByLabelText('Ouvrir le menu'))

    const connectLinks = screen.getAllByText('Se connecter')
    fireEvent.click(connectLinks[1]) // mobile version

    expect(screen.queryByText('Créer ma squad — c'est gratuit')).not.toBeInTheDocument()
  })

  it('closes mobile menu when "Créer ma squad — c'est gratuit" is clicked', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    fireEvent.click(screen.getByLabelText('Ouvrir le menu'))

    fireEvent.click(screen.getByText('Créer ma squad — c'est gratuit'))

    expect(screen.queryByText('Créer ma squad — c'est gratuit')).not.toBeInTheDocument()
  })

  // ─── Escape key closes mobile menu ─────────────────────

  it('closes mobile menu on Escape key press', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    fireEvent.click(screen.getByLabelText('Ouvrir le menu'))
    expect(screen.getByText('Créer ma squad — c'est gratuit')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByText('Créer ma squad — c'est gratuit')).not.toBeInTheDocument()
  })

  it('does nothing on non-Escape key press', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    fireEvent.click(screen.getByLabelText('Ouvrir le menu'))
    expect(screen.getByText('Créer ma squad — c'est gratuit')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Enter' })

    // Menu should still be open
    expect(screen.getByText('Créer ma squad — c'est gratuit')).toBeInTheDocument()
  })

  // ─── Scroll behavior ──────────────────────────────────

  it('header starts without scrolled styles', () => {
    render(<LandingNavbar isLoggedIn={false} />)
    const header = screen.getByRole('banner')
    expect(header.className).toContain('bg-transparent')
  })

  it('adds scrolled styles when window.scrollY > 20', () => {
    render(<LandingNavbar isLoggedIn={false} />)

    Object.defineProperty(window, 'scrollY', { value: 50, writable: true })
    fireEvent.scroll(window)

    const header = screen.getByRole('banner')
    expect(header.className).toContain('backdrop-blur-xl')
  })

  it('removes scrolled styles when scrolling back to top', () => {
    render(<LandingNavbar isLoggedIn={false} />)

    // Scroll down
    Object.defineProperty(window, 'scrollY', { value: 50, writable: true })
    fireEvent.scroll(window)

    // Scroll back up
    Object.defineProperty(window, 'scrollY', { value: 5, writable: true })
    fireEvent.scroll(window)

    const header = screen.getByRole('banner')
    expect(header.className).toContain('bg-transparent')
  })
})
