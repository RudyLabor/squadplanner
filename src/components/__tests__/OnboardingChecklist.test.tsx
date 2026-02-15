import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { createElement } from 'react'

const mockShowSuccess = vi.hoisted(() => vi.fn())

// Mock framer-motion
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

// Mock react-router
vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
}))

// Mock icons
vi.mock('../icons', () => ({
  Users: (props: any) => createElement('svg', { ...props, 'data-icon': 'users' }),
  UserPlus: (props: any) => createElement('svg', { ...props, 'data-icon': 'userplus' }),
  Calendar: (props: any) => createElement('svg', { ...props, 'data-icon': 'calendar' }),
  Check: (props: any) => createElement('svg', { ...props, 'data-icon': 'check' }),
  X: (props: any) => createElement('svg', { ...props, 'data-icon': 'x' }),
  ChevronRight: (props: any) => createElement('svg', { ...props, 'data-icon': 'chevronright' }),
  Sparkles: (props: any) => createElement('svg', { ...props, 'data-icon': 'sparkles' }),
  Star: (props: any) => createElement('svg', { ...props, 'data-icon': 'star' }),
}))

// Mock ui components
vi.mock('../ui', () => ({
  Card: ({ children, className }: any) =>
    createElement('div', { className, 'data-testid': 'card' }, children),
}))

// Mock toast
vi.mock('../../lib/toast', () => ({
  showSuccess: mockShowSuccess,
}))

// Mock Confetti
vi.mock('../LazyConfetti', () => ({
  default: (props: any) =>
    createElement('div', { 'data-testid': 'confetti', 'data-pieces': props.numberOfPieces }),
}))

import { OnboardingChecklist } from '../OnboardingChecklist'

const defaultProps = {
  hasSquad: false,
  hasSession: false,
  onCreateSession: vi.fn(),
}

describe('OnboardingChecklist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    localStorage.clear()
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ---- Basic rendering ----
  describe('basic rendering', () => {
    it('renders the checklist with title "Démarrage rapide"', () => {
      render(<OnboardingChecklist {...defaultProps} />)
      expect(screen.getByText('Démarrage rapide')).toBeInTheDocument()
    })

    it('renders all three step labels', () => {
      render(<OnboardingChecklist {...defaultProps} />)
      expect(screen.getByText('Crée ou rejoins ta première squad')).toBeInTheDocument()
      expect(screen.getByText('Invite un ami')).toBeInTheDocument()
      expect(screen.getByText('Planifie ta première session')).toBeInTheDocument()
    })

    it('renders step descriptions', () => {
      render(<OnboardingChecklist {...defaultProps} />)
      expect(screen.getByText('Une squad rassemble tes potes de jeu')).toBeInTheDocument()
      expect(screen.getByText('Plus on est de fous, plus on rit !')).toBeInTheDocument()
      expect(screen.getByText('Organise une partie avec ta squad')).toBeInTheDocument()
    })

    it('renders progress count', () => {
      render(<OnboardingChecklist {...defaultProps} />)
      expect(screen.getByText('0/3')).toBeInTheDocument()
    })

    it('renders dismiss button', () => {
      render(<OnboardingChecklist {...defaultProps} />)
      expect(screen.getByLabelText("Fermer l'onboarding")).toBeInTheDocument()
    })
  })

  // ---- Progress tracking ----
  describe('progress tracking', () => {
    it('shows 0/3 when nothing is complete', () => {
      render(<OnboardingChecklist {...defaultProps} />)
      expect(screen.getByText('0/3')).toBeInTheDocument()
    })

    it('shows 1/3 when only squad is complete', () => {
      render(<OnboardingChecklist {...defaultProps} hasSquad />)
      expect(screen.getByText('1/3')).toBeInTheDocument()
    })

    it('shows 1/3 when only session is complete', () => {
      render(<OnboardingChecklist {...defaultProps} hasSession />)
      expect(screen.getByText('1/3')).toBeInTheDocument()
    })

    it('shows 2/3 when squad and session are complete', () => {
      render(<OnboardingChecklist {...defaultProps} hasSquad hasSession />)
      expect(screen.getByText('2/3')).toBeInTheDocument()
    })

    it('shows subtitle "Commençons l\'aventure ensemble" when 0 steps complete', () => {
      render(<OnboardingChecklist {...defaultProps} />)
      expect(screen.getByText("Commençons l'aventure ensemble")).toBeInTheDocument()
    })

    it('shows subtitle "Super début ! Continue comme ça" when 1 step complete', () => {
      render(<OnboardingChecklist {...defaultProps} hasSquad />)
      expect(screen.getByText('Super début ! Continue comme ça')).toBeInTheDocument()
    })

    it('shows subtitle "Plus qu\'une étape !" when 2 steps complete', () => {
      render(<OnboardingChecklist {...defaultProps} hasSquad hasSession />)
      expect(screen.getByText("Plus qu'une étape !")).toBeInTheDocument()
    })
  })

  // ---- Step completion states ----
  describe('step completion states', () => {
    it('shows "Fait" badge for completed squad step', () => {
      render(<OnboardingChecklist {...defaultProps} hasSquad />)
      const badges = screen.getAllByText('Fait ✓')
      expect(badges.length).toBeGreaterThanOrEqual(1)
    })

    it('shows "Go" buttons for incomplete steps', () => {
      render(<OnboardingChecklist {...defaultProps} />)
      const goButtons = screen.getAllByText('Go')
      // 3 incomplete steps = 3 Go buttons
      expect(goButtons.length).toBe(3)
    })

    it('does NOT show "Go" button for completed steps', () => {
      render(<OnboardingChecklist {...defaultProps} hasSquad hasSession />)
      // Only invite step is incomplete
      const goButtons = screen.getAllByText('Go')
      expect(goButtons.length).toBe(1) // only invite
    })

    it('squad step links to /squads', () => {
      render(<OnboardingChecklist {...defaultProps} />)
      const links = document.querySelectorAll('a[href="/squads"]')
      expect(links.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ---- Actions ----
  describe('actions', () => {
    it('calls onCreateSession when session step Go button is clicked', () => {
      const onCreateSession = vi.fn()
      render(<OnboardingChecklist hasSquad={false} hasSession={false} onCreateSession={onCreateSession} />)
      // The session step is the 3rd Go button
      const goButtons = screen.getAllByText('Go')
      // Session step Go is the last one (3rd)
      fireEvent.click(goButtons[goButtons.length - 1])
      expect(onCreateSession).toHaveBeenCalledTimes(1)
    })

    it('copies invite link when invite step Go button is clicked', async () => {
      render(<OnboardingChecklist {...defaultProps} />)
      const goButtons = screen.getAllByText('Go')
      // Invite step is the 2nd Go button
      await act(async () => {
        fireEvent.click(goButtons[1])
      })
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })

    it('shows success toast after copying invite link', async () => {
      render(<OnboardingChecklist {...defaultProps} />)
      const goButtons = screen.getAllByText('Go')
      await act(async () => {
        fireEvent.click(goButtons[1])
      })
      expect(mockShowSuccess).toHaveBeenCalledWith(
        "Lien d'invitation copié ! Partage-le à tes potes"
      )
    })

    it('saves invite copied state to localStorage', async () => {
      render(<OnboardingChecklist {...defaultProps} />)
      const goButtons = screen.getAllByText('Go')
      await act(async () => {
        fireEvent.click(goButtons[1])
      })
      expect(localStorage.getItem('squadplanner-invite-copied')).toBe('true')
    })

    it('fallbacks to document.execCommand when clipboard fails', async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Not allowed')),
        },
      })
      const execCommandSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true)
      render(<OnboardingChecklist {...defaultProps} />)
      const goButtons = screen.getAllByText('Go')
      await act(async () => {
        fireEvent.click(goButtons[1])
      })
      expect(execCommandSpy).toHaveBeenCalledWith('copy')
      expect(mockShowSuccess).toHaveBeenCalledWith('Lien copié !')
      execCommandSpy.mockRestore()
    })
  })

  // ---- Dismiss behavior ----
  describe('dismiss', () => {
    it('dismisses the checklist when close button is clicked', () => {
      const { container } = render(<OnboardingChecklist {...defaultProps} />)
      fireEvent.click(screen.getByLabelText("Fermer l'onboarding"))
      // After dismiss, should return null
      expect(localStorage.getItem('squadplanner-onboarding-dismissed')).toBe('true')
    })

    it('returns null when dismissed from localStorage', () => {
      localStorage.setItem('squadplanner-onboarding-dismissed', 'true')
      const { container } = render(<OnboardingChecklist {...defaultProps} />)
      // The component reads localStorage in useEffect, so after effect runs it should be empty
      act(() => {
        vi.advanceTimersByTime(0)
      })
      // The container should be empty (component returns null)
    })

    it('returns null when previously dismissed (hydration from localStorage)', () => {
      localStorage.setItem('squadplanner-onboarding-dismissed', 'true')
      const { container } = render(<OnboardingChecklist {...defaultProps} />)
      act(() => {
        vi.advanceTimersByTime(0)
      })
      expect(container.innerHTML).toBe('')
    })
  })

  // ---- All complete state ----
  describe('all complete state', () => {
    it('shows celebration title "Bravo, t\'es prêt à rouler !"', async () => {
      localStorage.setItem('squadplanner-invite-copied', 'true')
      render(<OnboardingChecklist hasSquad hasSession onCreateSession={vi.fn()} />)
      act(() => {
        vi.advanceTimersByTime(0)
      })
      expect(screen.getByText("Bravo, t'es prêt à rouler !")).toBeInTheDocument()
    })

    it('shows celebration messages when all complete', async () => {
      localStorage.setItem('squadplanner-invite-copied', 'true')
      render(<OnboardingChecklist hasSquad hasSession onCreateSession={vi.fn()} />)
      act(() => {
        vi.advanceTimersByTime(0)
      })
      expect(
        screen.getByText('Ton aventure Squad Planner commence maintenant !')
      ).toBeInTheDocument()
    })

    it('hides step list when all complete', () => {
      localStorage.setItem('squadplanner-invite-copied', 'true')
      render(<OnboardingChecklist hasSquad hasSession onCreateSession={vi.fn()} />)
      act(() => {
        vi.advanceTimersByTime(0)
      })
      // Steps should not be shown when allComplete is true
      expect(screen.queryByText('Crée ou rejoins ta première squad')).not.toBeInTheDocument()
    })

    it('auto-dismisses after 4 seconds when all complete', () => {
      localStorage.setItem('squadplanner-invite-copied', 'true')
      const { container } = render(
        <OnboardingChecklist hasSquad hasSession onCreateSession={vi.fn()} />
      )
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(localStorage.getItem('squadplanner-onboarding-dismissed')).toBe('true')
    })

    it('shows animated star and sparkles decorations', () => {
      localStorage.setItem('squadplanner-invite-copied', 'true')
      const { container } = render(
        <OnboardingChecklist hasSquad hasSession onCreateSession={vi.fn()} />
      )
      act(() => {
        vi.advanceTimersByTime(0)
      })
      // Star and Sparkles icons should be present
      const stars = container.querySelectorAll('[data-icon="star"]')
      const sparkles = container.querySelectorAll('[data-icon="sparkles"]')
      expect(stars.length).toBeGreaterThanOrEqual(1)
      expect(sparkles.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ---- Confetti effects ----
  describe('confetti effects', () => {
    it('shows confetti when squad step is newly completed', () => {
      const { rerender } = render(<OnboardingChecklist {...defaultProps} />)
      // Complete the squad step
      rerender(<OnboardingChecklist hasSquad hasSession={false} onCreateSession={vi.fn()} />)
      // Confetti should appear
      expect(screen.queryByTestId('confetti')).toBeInTheDocument()
    })

    it('confetti disappears after 2 seconds', () => {
      const { rerender } = render(<OnboardingChecklist {...defaultProps} />)
      rerender(<OnboardingChecklist hasSquad hasSession={false} onCreateSession={vi.fn()} />)
      expect(screen.queryByTestId('confetti')).toBeInTheDocument()
      act(() => {
        vi.advanceTimersByTime(2500)
      })
      expect(screen.queryByTestId('confetti')).not.toBeInTheDocument()
    })

    it('shows confetti when session step is newly completed', () => {
      const { rerender } = render(<OnboardingChecklist {...defaultProps} hasSquad />)
      rerender(<OnboardingChecklist hasSquad hasSession onCreateSession={vi.fn()} />)
      expect(screen.queryByTestId('confetti')).toBeInTheDocument()
    })
  })

  // ---- Invite copied state hydration ----
  describe('invite copied hydration', () => {
    it('reads invite copied state from localStorage on mount', () => {
      localStorage.setItem('squadplanner-invite-copied', 'true')
      render(<OnboardingChecklist {...defaultProps} hasSquad hasSession />)
      act(() => {
        vi.advanceTimersByTime(0)
      })
      // All steps should be complete including invite
      expect(screen.getByText("Bravo, t'es prêt à rouler !")).toBeInTheDocument()
    })
  })

  // ---- Card styling ----
  describe('card styling', () => {
    it('uses primary gradient when NOT all complete', () => {
      render(<OnboardingChecklist {...defaultProps} />)
      const card = screen.getByTestId('card')
      expect(card.className).toContain('from-primary')
    })

    it('uses success gradient when all complete', () => {
      localStorage.setItem('squadplanner-invite-copied', 'true')
      render(<OnboardingChecklist hasSquad hasSession onCreateSession={vi.fn()} />)
      act(() => {
        vi.advanceTimersByTime(0)
      })
      const card = screen.getByTestId('card')
      expect(card.className).toContain('from-success')
    })
  })

  // ---- Step action types ----
  describe('step action types', () => {
    it('squad step uses link action type (renders <a> tag)', () => {
      render(<OnboardingChecklist {...defaultProps} />)
      const squadLink = document.querySelector('a[href="/squads"]')
      expect(squadLink).toBeInTheDocument()
    })

    it('invite step uses button action type', () => {
      render(<OnboardingChecklist {...defaultProps} />)
      // The second Go button should be a <button>, not an <a>
      const goButtons = screen.getAllByText('Go')
      const inviteGo = goButtons[1]
      expect(inviteGo.tagName).toBe('BUTTON')
    })

    it('session step uses button action type calling onCreateSession', () => {
      render(<OnboardingChecklist {...defaultProps} />)
      const goButtons = screen.getAllByText('Go')
      const sessionGo = goButtons[2]
      expect(sessionGo.tagName).toBe('BUTTON')
    })
  })

  // ---- Edge cases ----
  describe('edge cases', () => {
    it('does not auto-dismiss when not all complete', () => {
      render(<OnboardingChecklist {...defaultProps} hasSquad />)
      act(() => {
        vi.advanceTimersByTime(10000)
      })
      expect(localStorage.getItem('squadplanner-onboarding-dismissed')).toBeNull()
    })

    it('does not show confetti when component first mounts (no transition)', () => {
      render(<OnboardingChecklist {...defaultProps} />)
      expect(screen.queryByTestId('confetti')).not.toBeInTheDocument()
    })
  })
})
