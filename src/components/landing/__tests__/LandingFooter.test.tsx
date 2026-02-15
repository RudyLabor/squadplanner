import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createElement } from 'react'

// Hoisted mock for supabase so it can be referenced in vi.mock factory
const mockInsert = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn(() => ({ insert: mockInsert })))

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

vi.mock('../../icons', () => new Proxy({}, {
  get: (_t, p) => typeof p === 'string' ? (props: any) => createElement('span', { ...props, 'data-testid': `icon-${String(p)}` }, String(p)) : undefined,
}))

vi.mock('../../SquadPlannerLogo', () => ({
  SquadPlannerLogo: ({ size }: any) => createElement('span', { 'data-testid': 'logo', 'data-size': size }, 'Logo'),
}))

vi.mock('../../lib/supabaseMinimal', () => ({
  supabase: { from: mockFrom },
}))

import { LandingFooter } from '../LandingFooter'

describe('LandingFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
  })

  // ─── Basic structure ────────────────────────────────
  describe('basic structure', () => {
    it('renders a footer element', () => {
      const { container } = render(<LandingFooter />)
      expect(container.querySelector('footer')).toBeInTheDocument()
    })

    it('renders "Squad Planner" brand name', () => {
      render(<LandingFooter />)
      expect(screen.getByText('Squad Planner')).toBeInTheDocument()
    })

    it('renders tagline "Le Calendly du gaming"', () => {
      render(<LandingFooter />)
      expect(screen.getByText('Le Calendly du gaming')).toBeInTheDocument()
    })

    it('renders copyright text', () => {
      render(<LandingFooter />)
      expect(screen.getByText('© 2026 Squad Planner. Jouez ensemble, pour de vrai.')).toBeInTheDocument()
    })

    it('renders the SquadPlannerLogo with size 20', () => {
      render(<LandingFooter />)
      const logo = screen.getByTestId('logo')
      expect(logo).toHaveAttribute('data-size', '20')
    })
  })

  // ─── Footer sections (navigation) ──────────────────
  describe('footer sections', () => {
    it('renders "Produit" section heading', () => {
      render(<LandingFooter />)
      expect(screen.getByText('Produit')).toBeInTheDocument()
    })

    it('renders "Ressources" section heading', () => {
      render(<LandingFooter />)
      expect(screen.getByText('Ressources')).toBeInTheDocument()
    })

    it('renders "Légal" section heading', () => {
      render(<LandingFooter />)
      expect(screen.getByText('Légal')).toBeInTheDocument()
    })

    it('renders "Communauté" section heading', () => {
      render(<LandingFooter />)
      expect(screen.getByText('Communauté')).toBeInTheDocument()
    })
  })

  // ─── Produit section links ─────────────────────────
  describe('Produit links', () => {
    it('renders "Créer ma squad" link pointing to auth register', () => {
      render(<LandingFooter />)
      const link = screen.getByText('Créer ma squad')
      expect(link.closest('a')).toHaveAttribute('href', '/auth?mode=register&redirect=onboarding')
    })

    it('renders "Premium" link', () => {
      render(<LandingFooter />)
      const link = screen.getByText('Premium')
      expect(link.closest('a')).toHaveAttribute('href', '/premium')
    })

    it('renders "Fonctionnalités" anchor link', () => {
      render(<LandingFooter />)
      const link = screen.getByText('Fonctionnalités')
      expect(link.closest('a')).toHaveAttribute('href', '#features')
    })
  })

  // ─── Ressources section links ──────────────────────
  describe('Ressources links', () => {
    it('renders FAQ link with HelpCircle icon', () => {
      render(<LandingFooter />)
      expect(screen.getByText('FAQ')).toBeInTheDocument()
      const faqLink = screen.getByText('FAQ').closest('a')
      expect(faqLink).toHaveAttribute('href', '/help')
    })

    it('renders Contact link', () => {
      render(<LandingFooter />)
      expect(screen.getByText('Contact')).toBeInTheDocument()
      const contactLink = screen.getByText('Contact').closest('a')
      expect(contactLink).toHaveAttribute('href', 'mailto:contact@squadplanner.fr')
    })
  })

  // ─── Légal section links ──────────────────────────
  describe('Légal links', () => {
    it('renders CGU link with FileText icon', () => {
      render(<LandingFooter />)
      expect(screen.getByText('CGU')).toBeInTheDocument()
      const cguLink = screen.getByText('CGU').closest('a')
      expect(cguLink).toHaveAttribute('href', '/legal')
    })

    it('renders Confidentialité link with Shield icon', () => {
      render(<LandingFooter />)
      expect(screen.getByText('Confidentialité')).toBeInTheDocument()
      const privacyLink = screen.getByText('Confidentialité').closest('a')
      expect(privacyLink).toHaveAttribute('href', '/legal?tab=privacy')
    })
  })

  // ─── Communauté section ────────────────────────────
  describe('Communauté links', () => {
    it('renders "Accès gratuit" with green pulse dot', () => {
      render(<LandingFooter />)
      expect(screen.getByText('Accès gratuit')).toBeInTheDocument()
    })

    it('renders the animate-pulse green dot for "Accès gratuit"', () => {
      const { container } = render(<LandingFooter />)
      const pulseDot = container.querySelector('.animate-pulse.bg-success')
      expect(pulseDot).toBeInTheDocument()
    })

    it('renders "Twitter / X" link with correct href and attributes', () => {
      render(<LandingFooter />)
      const twitterLink = screen.getByText('Twitter / X').closest('a')
      expect(twitterLink).toHaveAttribute('href', 'https://x.com/squadplannerfr')
      expect(twitterLink).toHaveAttribute('target', '_blank')
      expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('renders "Nous contacter" mailto link', () => {
      render(<LandingFooter />)
      const contactLink = screen.getByText('Nous contacter').closest('a')
      expect(contactLink).toHaveAttribute('href', 'mailto:contact@squadplanner.fr')
    })
  })

  // ─── Trust badges ──────────────────────────────────
  describe('trust badges', () => {
    it('renders "Hébergé en France" badge', () => {
      render(<LandingFooter />)
      expect(screen.getByText(/Hébergé en France/)).toBeInTheDocument()
    })

    it('renders "RGPD compliant" badge', () => {
      render(<LandingFooter />)
      expect(screen.getByText(/RGPD compliant/)).toBeInTheDocument()
    })

    it('renders "Données chiffrées" badge', () => {
      render(<LandingFooter />)
      expect(screen.getByText(/Données chiffrées/)).toBeInTheDocument()
    })
  })

  // ─── Activity stats ────────────────────────────────
  describe('activity stats', () => {
    it('renders gamer count', () => {
      render(<LandingFooter />)
      expect(screen.getByText('+2 000 gamers inscrits')).toBeInTheDocument()
    })

    it('renders sessions count', () => {
      render(<LandingFooter />)
      expect(screen.getByText('+5 000 sessions planifiées')).toBeInTheDocument()
    })

    it('renders satisfaction score', () => {
      render(<LandingFooter />)
      expect(screen.getByText('4.9/5 satisfaction')).toBeInTheDocument()
    })
  })

  // ─── Newsletter form ───────────────────────────────
  describe('newsletter form', () => {
    it('renders email input with correct aria-label', () => {
      render(<LandingFooter />)
      const input = screen.getByLabelText('Adresse email pour la newsletter')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'email')
      expect(input).toHaveAttribute('name', 'email')
      expect(input).toHaveAttribute('required')
    })

    it('renders email input with placeholder', () => {
      render(<LandingFooter />)
      expect(screen.getByPlaceholderText('Reçois les updates Squad Planner')).toBeInTheDocument()
    })

    it('renders submit button with "S\'abonner" text', () => {
      render(<LandingFooter />)
      expect(screen.getByText("S'abonner")).toBeInTheDocument()
    })

    it('submit button is type="submit"', () => {
      render(<LandingFooter />)
      const btn = screen.getByText("S'abonner").closest('button')
      expect(btn).toHaveAttribute('type', 'submit')
    })

    it('renders Mail icon in input area', () => {
      render(<LandingFooter />)
      expect(screen.getByTestId('icon-Mail')).toBeInTheDocument()
    })

    it('email input updates on change', () => {
      render(<LandingFooter />)
      const input = screen.getByLabelText('Adresse email pour la newsletter') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'test@example.com' } })
      expect(input.value).toBe('test@example.com')
    })

    it('form has noValidate attribute', () => {
      const { container } = render(<LandingFooter />)
      const form = container.querySelector('form')
      expect(form).toHaveAttribute('novalidate')
    })
  })

  // ─── Newsletter validation ─────────────────────────
  describe('newsletter validation', () => {
    it('shows error for empty email on submit', async () => {
      render(<LandingFooter />)
      const form = screen.getByText("S'abonner").closest('button')!
      fireEvent.click(form)
      expect(await screen.findByRole('alert')).toHaveTextContent('Email invalide')
    })

    it('shows error for invalid email format', async () => {
      render(<LandingFooter />)
      const input = screen.getByLabelText('Adresse email pour la newsletter')
      fireEvent.change(input, { target: { value: 'not-an-email' } })
      const form = screen.getByText("S'abonner").closest('button')!
      fireEvent.click(form)
      expect(await screen.findByRole('alert')).toHaveTextContent('Email invalide')
    })

    it('shows error for email without TLD', async () => {
      render(<LandingFooter />)
      const input = screen.getByLabelText('Adresse email pour la newsletter')
      fireEvent.change(input, { target: { value: 'user@domain' } })
      const form = screen.getByText("S'abonner").closest('button')!
      fireEvent.click(form)
      expect(await screen.findByRole('alert')).toHaveTextContent('Email invalide')
    })

    it('shows error for whitespace-only email', async () => {
      render(<LandingFooter />)
      const input = screen.getByLabelText('Adresse email pour la newsletter')
      fireEvent.change(input, { target: { value: '   ' } })
      const form = screen.getByText("S'abonner").closest('button')!
      fireEvent.click(form)
      expect(await screen.findByRole('alert')).toHaveTextContent('Email invalide')
    })

    it('clears error when user types in input', async () => {
      render(<LandingFooter />)
      const input = screen.getByLabelText('Adresse email pour la newsletter')
      const submitBtn = screen.getByText("S'abonner").closest('button')!

      // Trigger error
      fireEvent.click(submitBtn)
      expect(await screen.findByRole('alert')).toHaveTextContent('Email invalide')

      // Type to clear error
      fireEvent.change(input, { target: { value: 'a' } })
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('clears success message when user types in input', async () => {
      mockInsert.mockResolvedValueOnce({ error: null })
      render(<LandingFooter />)
      const input = screen.getByLabelText('Adresse email pour la newsletter')
      const submitBtn = screen.getByText("S'abonner").closest('button')!

      // Submit successfully
      fireEvent.change(input, { target: { value: 'valid@email.com' } })
      fireEvent.click(submitBtn)
      expect(await screen.findByRole('status')).toHaveTextContent('Merci ! Tu recevras nos updates.')

      // Type to clear success
      fireEvent.change(input, { target: { value: 'new@email.com' } })
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  // ─── Newsletter submission success ─────────────────
  describe('newsletter submission success', () => {
    it('calls supabase to insert email on valid submit', async () => {
      mockInsert.mockResolvedValueOnce({ error: null })
      render(<LandingFooter />)
      const input = screen.getByLabelText('Adresse email pour la newsletter')
      const submitBtn = screen.getByText("S'abonner").closest('button')!

      fireEvent.change(input, { target: { value: 'test@example.com' } })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('newsletter')
        expect(mockInsert).toHaveBeenCalledWith({ email: 'test@example.com' })
      })
    })

    it('shows success message after successful submission', async () => {
      mockInsert.mockResolvedValueOnce({ error: null })
      render(<LandingFooter />)
      const input = screen.getByLabelText('Adresse email pour la newsletter')
      const submitBtn = screen.getByText("S'abonner").closest('button')!

      fireEvent.change(input, { target: { value: 'test@example.com' } })
      fireEvent.click(submitBtn)

      expect(await screen.findByRole('status')).toHaveTextContent('Merci ! Tu recevras nos updates.')
    })

    it('clears email input after successful submission', async () => {
      mockInsert.mockResolvedValueOnce({ error: null })
      render(<LandingFooter />)
      const input = screen.getByLabelText('Adresse email pour la newsletter') as HTMLInputElement

      fireEvent.change(input, { target: { value: 'test@example.com' } })
      const submitBtn = screen.getByText("S'abonner").closest('button')!
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(input.value).toBe('')
      })
    })
  })

  // ─── Newsletter submission error ───────────────────
  describe('newsletter submission error', () => {
    it('shows error message when supabase insert fails', async () => {
      mockInsert.mockResolvedValueOnce({ error: new Error('DB error') })
      render(<LandingFooter />)
      const input = screen.getByLabelText('Adresse email pour la newsletter')
      const submitBtn = screen.getByText("S'abonner").closest('button')!

      fireEvent.change(input, { target: { value: 'test@example.com' } })
      fireEvent.click(submitBtn)

      expect(await screen.findByRole('alert')).toHaveTextContent('Une erreur est survenue. Réessaie.')
    })

    it('shows error message when supabase import throws', async () => {
      mockInsert.mockRejectedValueOnce(new Error('Network error'))
      render(<LandingFooter />)
      const input = screen.getByLabelText('Adresse email pour la newsletter')
      const submitBtn = screen.getByText("S'abonner").closest('button')!

      fireEvent.change(input, { target: { value: 'test@example.com' } })
      fireEvent.click(submitBtn)

      expect(await screen.findByRole('alert')).toHaveTextContent('Une erreur est survenue. Réessaie.')
    })
  })

  // ─── Newsletter loading state ──────────────────────
  describe('newsletter loading state', () => {
    it('disables submit button while loading', async () => {
      let resolveInsert: any
      mockInsert.mockImplementation(() => new Promise(resolve => { resolveInsert = resolve }))
      render(<LandingFooter />)
      const input = screen.getByLabelText('Adresse email pour la newsletter')
      const submitBtn = screen.getByText("S'abonner").closest('button')!

      fireEvent.change(input, { target: { value: 'test@example.com' } })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(submitBtn).toBeDisabled()
      })

      // Resolve to cleanup
      resolveInsert({ error: null })
    })

    it('shows spinner while loading', async () => {
      let resolveInsert: any
      mockInsert.mockImplementation(() => new Promise(resolve => { resolveInsert = resolve }))
      render(<LandingFooter />)
      const input = screen.getByLabelText('Adresse email pour la newsletter')
      const submitBtn = screen.getByText("S'abonner").closest('button')!

      fireEvent.change(input, { target: { value: 'test@example.com' } })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        const spinner = submitBtn.querySelector('.animate-spin')
        expect(spinner).toBeInTheDocument()
      })

      // Resolve to cleanup
      resolveInsert({ error: null })
    })

    it('re-enables submit button after successful submission', async () => {
      mockInsert.mockResolvedValueOnce({ error: null })
      render(<LandingFooter />)
      const input = screen.getByLabelText('Adresse email pour la newsletter')
      const submitBtn = screen.getByText("S'abonner").closest('button')!

      fireEvent.change(input, { target: { value: 'test@example.com' } })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(submitBtn).not.toBeDisabled()
      })
    })

    it('re-enables submit button after failed submission', async () => {
      mockInsert.mockResolvedValueOnce({ error: new Error('fail') })
      render(<LandingFooter />)
      const input = screen.getByLabelText('Adresse email pour la newsletter')
      const submitBtn = screen.getByText("S'abonner").closest('button')!

      fireEvent.change(input, { target: { value: 'test@example.com' } })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(submitBtn).not.toBeDisabled()
      })
    })
  })

  // ─── Icons in footer ───────────────────────────────
  describe('icons', () => {
    it('renders HelpCircle icon in FAQ link', () => {
      render(<LandingFooter />)
      expect(screen.getByTestId('icon-HelpCircle')).toBeInTheDocument()
    })

    it('renders FileText icon in CGU link', () => {
      render(<LandingFooter />)
      expect(screen.getByTestId('icon-FileText')).toBeInTheDocument()
    })

    it('renders Shield icon in Confidentialité link', () => {
      render(<LandingFooter />)
      expect(screen.getByTestId('icon-Shield')).toBeInTheDocument()
    })

    it('renders Mail icon in newsletter form', () => {
      render(<LandingFooter />)
      expect(screen.getByTestId('icon-Mail')).toBeInTheDocument()
    })

    it('renders X/Twitter SVG icon', () => {
      const { container } = render(<LandingFooter />)
      // The X icon is a raw SVG (not from icons mock)
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThanOrEqual(1)
    })
  })
})
