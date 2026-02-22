import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { createElement } from 'react'

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

vi.mock(
  '../../icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t, p) =>
          typeof p === 'string'
            ? (props: any) =>
                createElement('span', { ...props, 'data-testid': `icon-${String(p)}` }, String(p))
            : undefined,
      }
    )
)

import { demoSteps, stepComponents, PhoneFrame, type DemoStep } from '../DemoSteps'

describe('DemoSteps', () => {
  // ─── demoSteps data export ──────────────────────────
  describe('demoSteps data', () => {
    it('exports exactly 4 steps', () => {
      expect(demoSteps).toHaveLength(4)
    })

    it('each step has all required DemoStep fields', () => {
      for (const step of demoSteps) {
        expect(step).toHaveProperty('id')
        expect(step).toHaveProperty('title')
        expect(step).toHaveProperty('subtitle')
        expect(step).toHaveProperty('duration')
        expect(step).toHaveProperty('icon')
        expect(step).toHaveProperty('color')
        expect(typeof step.id).toBe('string')
        expect(typeof step.title).toBe('string')
        expect(typeof step.subtitle).toBe('string')
        expect(typeof step.duration).toBe('number')
        expect(typeof step.icon).toBe('function')
        expect(typeof step.color).toBe('string')
      }
    })

    it('steps are in correct order: create, invite, rsvp, play', () => {
      expect(demoSteps[0].id).toBe('create')
      expect(demoSteps[1].id).toBe('invite')
      expect(demoSteps[2].id).toBe('rsvp')
      expect(demoSteps[3].id).toBe('play')
    })

    it('create step has correct details', () => {
      const step = demoSteps[0]
      expect(step.title).toBe('Crée ta Squad')
      expect(step.subtitle).toBe('"Les Invaincus"')
      expect(step.duration).toBe(3000)
      expect(step.color).toBe('var(--color-primary)')
    })

    it('invite step has correct details', () => {
      const step = demoSteps[1]
      expect(step.title).toBe('Invite tes potes')
      expect(step.subtitle).toBe('3 joueurs ont rejoint')
      expect(step.duration).toBe(2500)
      expect(step.color).toBe('var(--color-success)')
    })

    it('rsvp step has correct details', () => {
      const step = demoSteps[2]
      expect(step.title).toBe('Chacun confirme')
      expect(step.subtitle).toBe('4/4 présents mardi 21h')
      expect(step.duration).toBe(2500)
      expect(step.color).toBe('var(--color-warning)')
    })

    it('play step has correct details', () => {
      const step = demoSteps[3]
      expect(step.title).toBe('Jouez ensemble !')
      expect(step.subtitle).toBe('Party vocale en cours')
      expect(step.duration).toBe(3000)
      expect(step.color).toBe('var(--color-purple)')
    })
  })

  // ─── stepComponents export ──────────────────────────
  describe('stepComponents', () => {
    it('exports a component for each step id', () => {
      expect(typeof stepComponents.create).toBe('function')
      expect(typeof stepComponents.invite).toBe('function')
      expect(typeof stepComponents.rsvp).toBe('function')
      expect(typeof stepComponents.play).toBe('function')
    })

    it('stepComponents keys match demoSteps ids', () => {
      for (const step of demoSteps) {
        expect(stepComponents[step.id]).toBeDefined()
      }
    })
  })

  // ─── PhoneFrame ─────────────────────────────────────
  describe('PhoneFrame', () => {
    it('renders children inside the frame', () => {
      render(
        <PhoneFrame>
          <span>Test Child</span>
        </PhoneFrame>
      )
      expect(screen.getByText('Test Child')).toBeInTheDocument()
    })

    it('renders the status bar with time 21:00', () => {
      render(
        <PhoneFrame>
          <span>Content</span>
        </PhoneFrame>
      )
      expect(screen.getByText('21:00')).toBeInTheDocument()
    })

    it('renders the notch element', () => {
      const { container } = render(
        <PhoneFrame>
          <span>Content</span>
        </PhoneFrame>
      )
      // The notch is an absolute div with w-24 h-5
      const notch = container.querySelector('.w-24.h-5')
      expect(notch).toBeInTheDocument()
    })

    it('renders the glow effect behind phone', () => {
      const { container } = render(
        <PhoneFrame>
          <span>Content</span>
        </PhoneFrame>
      )
      const glow = container.querySelector('.blur-2xl')
      expect(glow).toBeInTheDocument()
    })

    it('renders SVG icons in the status bar (wifi and battery)', () => {
      const { container } = render(
        <PhoneFrame>
          <span>Content</span>
        </PhoneFrame>
      )
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBe(2) // wifi + battery
    })

    it('renders multiple children', () => {
      render(
        <PhoneFrame>
          <span>First</span>
          <span>Second</span>
        </PhoneFrame>
      )
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
    })
  })

  // ─── CreateStep ─────────────────────────────────────
  describe('CreateStep', () => {
    it('renders "Nouvelle Squad" header', () => {
      const Create = stepComponents.create
      render(<Create />)
      expect(screen.getByText('Nouvelle Squad')).toBeInTheDocument()
    })

    it('renders the squad name "Les Invaincus"', () => {
      const Create = stepComponents.create
      render(<Create />)
      expect(screen.getByText('Les Invaincus')).toBeInTheDocument()
    })

    it('renders "Nom de la squad" label', () => {
      const Create = stepComponents.create
      render(<Create />)
      expect(screen.getByText('Nom de la squad')).toBeInTheDocument()
    })

    it('renders the game section with "Jeu" label and "Valorant"', () => {
      const Create = stepComponents.create
      render(<Create />)
      expect(screen.getByText('Jeu')).toBeInTheDocument()
      expect(screen.getByText('Valorant')).toBeInTheDocument()
    })

    it('renders "Jeux populaires" section with 3 games', () => {
      const Create = stepComponents.create
      render(<Create />)
      expect(screen.getByText('Jeux populaires')).toBeInTheDocument()
      expect(screen.getByText('League of Legends')).toBeInTheDocument()
      expect(screen.getByText('Fortnite')).toBeInTheDocument()
      expect(screen.getByText('Apex')).toBeInTheDocument()
    })

    it('renders the "Créer la squad" button', () => {
      const Create = stepComponents.create
      render(<Create />)
      expect(screen.getByText('Créer la squad')).toBeInTheDocument()
    })

    it('renders the DemoNavbar with "squads" active', () => {
      const Create = stepComponents.create
      render(<Create />)
      // DemoNavbar renders all 5 nav items; check Squads is present
      expect(screen.getByText('Squads')).toBeInTheDocument()
      expect(screen.getByText('Accueil')).toBeInTheDocument()
      expect(screen.getByText('Party')).toBeInTheDocument()
      expect(screen.getByText('Messages')).toBeInTheDocument()
      expect(screen.getByText('Profil')).toBeInTheDocument()
    })

    it('navbar highlights "Squads" as active with primary color', () => {
      const Create = stepComponents.create
      const { container } = render(<Create />)
      // The icon for squads should have primary color
      const navIcons = container.querySelectorAll('[data-testid="icon-Users"]')
      // There's at least one Users icon in the navbar
      const navbarIcon = navIcons[navIcons.length - 1]
      expect(navbarIcon).toHaveStyle({ color: 'var(--color-primary)' })
    })
  })

  // ─── InviteStep ─────────────────────────────────────
  describe('InviteStep', () => {
    it('renders "Les Invaincus" header', () => {
      const Invite = stepComponents.invite
      render(<Invite />)
      expect(screen.getByText('Les Invaincus')).toBeInTheDocument()
    })

    it('renders "Invite tes potes" title', () => {
      const Invite = stepComponents.invite
      render(<Invite />)
      expect(screen.getByText('Invite tes potes')).toBeInTheDocument()
    })

    it('renders all 5 mock users', () => {
      const Invite = stepComponents.invite
      render(<Invite />)
      expect(screen.getByText('Alex')).toBeInTheDocument()
      expect(screen.getByText('Sarah')).toBeInTheDocument()
      expect(screen.getByText('Lucas')).toBeInTheDocument()
      expect(screen.getByText('Emma')).toBeInTheDocument()
      expect(screen.getByText('Hugo')).toBeInTheDocument()
    })

    it('renders "A rejoint" badge for each user', () => {
      const Invite = stepComponents.invite
      render(<Invite />)
      const badges = screen.getAllByText('A rejoint')
      expect(badges).toHaveLength(5)
    })

    it('renders user emojis', () => {
      const Invite = stepComponents.invite
      render(<Invite />)
      expect(screen.getByText('🎮')).toBeInTheDocument()
      expect(screen.getByText('🎯')).toBeInTheDocument()
      expect(screen.getByText('🔥')).toBeInTheDocument()
      expect(screen.getByText('⭐')).toBeInTheDocument()
      expect(screen.getByText('🎧')).toBeInTheDocument()
    })

    it('renders the share link section', () => {
      const Invite = stepComponents.invite
      render(<Invite />)
      expect(screen.getByText('squadplanner.fr/join/8J9DQR')).toBeInTheDocument()
      expect(screen.getByText('Copier')).toBeInTheDocument()
    })

    it('renders the Share2 icon in the link section', () => {
      const Invite = stepComponents.invite
      render(<Invite />)
      expect(screen.getByTestId('icon-Share2')).toBeInTheDocument()
    })

    it('renders DemoNavbar with "squads" active', () => {
      const Invite = stepComponents.invite
      render(<Invite />)
      expect(screen.getByText('Squads')).toBeInTheDocument()
    })
  })

  // ─── RSVPStep ───────────────────────────────────────
  describe('RSVPStep', () => {
    it('renders "Session de jeu" header', () => {
      const RSVP = stepComponents.rsvp
      render(<RSVP />)
      expect(screen.getByText('Session de jeu')).toBeInTheDocument()
    })

    it('renders "Ranked Mardi 21h" title', () => {
      const RSVP = stepComponents.rsvp
      render(<RSVP />)
      expect(screen.getByText('Ranked Mardi 21h')).toBeInTheDocument()
    })

    it('renders squad and game info', () => {
      const RSVP = stepComponents.rsvp
      render(<RSVP />)
      expect(screen.getByText('Les Invaincus · Valorant')).toBeInTheDocument()
    })

    it('renders first 4 mock users (not all 5)', () => {
      const RSVP = stepComponents.rsvp
      render(<RSVP />)
      expect(screen.getByText('Alex')).toBeInTheDocument()
      expect(screen.getByText('Sarah')).toBeInTheDocument()
      expect(screen.getByText('Lucas')).toBeInTheDocument()
      expect(screen.getByText('Emma')).toBeInTheDocument()
      expect(screen.queryByText('Hugo')).not.toBeInTheDocument()
    })

    it('renders check SVG icons for each user (confirmation)', () => {
      const RSVP = stepComponents.rsvp
      const { container } = render(<RSVP />)
      // Each of the 4 users has a checkmark SVG
      const checkCircles = container.querySelectorAll('.bg-success')
      expect(checkCircles.length).toBeGreaterThanOrEqual(4)
    })

    it('renders "Session confirmée !" status', () => {
      const RSVP = stepComponents.rsvp
      render(<RSVP />)
      expect(screen.getByText('Session confirmée !')).toBeInTheDocument()
    })

    it('renders user emojis for first 4 users', () => {
      const RSVP = stepComponents.rsvp
      render(<RSVP />)
      expect(screen.getByText('🎮')).toBeInTheDocument()
      expect(screen.getByText('🎯')).toBeInTheDocument()
      expect(screen.getByText('🔥')).toBeInTheDocument()
      expect(screen.getByText('⭐')).toBeInTheDocument()
    })

    it('renders DemoNavbar with "squads" active', () => {
      const RSVP = stepComponents.rsvp
      render(<RSVP />)
      expect(screen.getByText('Squads')).toBeInTheDocument()
    })
  })

  // ─── PlayStep ───────────────────────────────────────
  describe('PlayStep', () => {
    it('renders "Party vocale en cours" header', () => {
      const Play = stepComponents.play
      render(<Play />)
      expect(screen.getByText('Party vocale en cours')).toBeInTheDocument()
    })

    it('renders squad and game info', () => {
      const Play = stepComponents.play
      render(<Play />)
      expect(screen.getByText('Les Invaincus · Valorant')).toBeInTheDocument()
    })

    it('renders first 4 mock users', () => {
      const Play = stepComponents.play
      render(<Play />)
      expect(screen.getByText('Alex')).toBeInTheDocument()
      expect(screen.getByText('Sarah')).toBeInTheDocument()
      expect(screen.getByText('Lucas')).toBeInTheDocument()
      expect(screen.getByText('Emma')).toBeInTheDocument()
      expect(screen.queryByText('Hugo')).not.toBeInTheDocument()
    })

    it('first user (Alex, i=0) name has text-success class', () => {
      const Play = stepComponents.play
      const { container } = render(<Play />)
      const alexName = screen.getByText('Alex')
      expect(alexName.className).toContain('text-success')
    })

    it('other users (i>0) names have text-text-primary class', () => {
      const Play = stepComponents.play
      render(<Play />)
      const sarahName = screen.getByText('Sarah')
      expect(sarahName.className).toContain('text-text-primary')
      const lucasName = screen.getByText('Lucas')
      expect(lucasName.className).toContain('text-text-primary')
    })

    it('renders "4 en ligne" text', () => {
      const Play = stepComponents.play
      render(<Play />)
      expect(screen.getByText('4 en ligne')).toBeInTheDocument()
    })

    it('renders "En jeu · Valorant" text', () => {
      const Play = stepComponents.play
      render(<Play />)
      expect(screen.getByText('En jeu · Valorant')).toBeInTheDocument()
    })

    it('renders audio visualizer bars in the center (5 bars)', () => {
      const Play = stepComponents.play
      const { container } = render(<Play />)
      // 5 main visualizer bars with bg-primary class
      const primaryBars = container.querySelectorAll('.bg-primary')
      expect(primaryBars.length).toBe(5)
    })

    it('renders per-user audio indicator bars (3 bars per user for 4 users)', () => {
      const Play = stepComponents.play
      const { container } = render(<Play />)
      // Each user card has 3 small audio bars (div with w-[2px])
      const smallBars = container.querySelectorAll('[class*="w-\\[2px\\]"]')
      // 4 users x 3 bars = 12
      expect(smallBars.length).toBe(12)
    })

    it('renders DemoNavbar with "party" active', () => {
      const Play = stepComponents.play
      render(<Play />)
      // In play step, navbar has party active
      expect(screen.getByText('Party')).toBeInTheDocument()
    })

    it('user emojis are rendered for first 4 users', () => {
      const Play = stepComponents.play
      render(<Play />)
      expect(screen.getByText('🎮')).toBeInTheDocument()
      expect(screen.getByText('🎯')).toBeInTheDocument()
      expect(screen.getByText('🔥')).toBeInTheDocument()
      expect(screen.getByText('⭐')).toBeInTheDocument()
    })
  })

  // ─── DemoNavbar internal rendering ──────────────────
  describe('DemoNavbar (rendered through steps)', () => {
    it('renders all 5 navigation items', () => {
      const Create = stepComponents.create
      render(<Create />)
      expect(screen.getByText('Accueil')).toBeInTheDocument()
      expect(screen.getByText('Squads')).toBeInTheDocument()
      expect(screen.getByText('Party')).toBeInTheDocument()
      expect(screen.getByText('Messages')).toBeInTheDocument()
      expect(screen.getByText('Profil')).toBeInTheDocument()
    })

    it('active nav item has font-medium and text-primary class', () => {
      const Create = stepComponents.create
      render(<Create />)
      // Squads is active in CreateStep
      const squadsLabel = screen.getByText('Squads')
      expect(squadsLabel.className).toContain('text-primary')
      expect(squadsLabel.className).toContain('font-medium')
    })

    it('inactive nav items have text-text-tertiary class', () => {
      const Create = stepComponents.create
      render(<Create />)
      const homeLabel = screen.getByText('Accueil')
      expect(homeLabel.className).toContain('text-text-tertiary')
    })

    it('party step navbar has "party" active', () => {
      const Play = stepComponents.play
      render(<Play />)
      const partyLabel = screen.getByText('Party')
      expect(partyLabel.className).toContain('text-primary')
      expect(partyLabel.className).toContain('font-medium')
    })

    it('renders icons for each nav item', () => {
      const Create = stepComponents.create
      render(<Create />)
      expect(screen.getByTestId('icon-Home')).toBeInTheDocument()
      expect(screen.getByTestId('icon-MessageCircle')).toBeInTheDocument()
      expect(screen.getByTestId('icon-User')).toBeInTheDocument()
      expect(screen.getByTestId('icon-Mic')).toBeInTheDocument()
    })
  })
})
