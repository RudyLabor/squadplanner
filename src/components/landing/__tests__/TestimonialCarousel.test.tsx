import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
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

vi.mock('../../icons', () => ({
  ChevronLeft: (props: any) =>
    createElement('span', { ...props, 'data-testid': 'icon-chevron-left' }, 'left'),
  ChevronRight: (props: any) =>
    createElement('span', { ...props, 'data-testid': 'icon-chevron-right' }, 'right'),
}))

import { TestimonialCarousel } from '../TestimonialCarousel'

describe('TestimonialCarousel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Default to mobile view (1 card per view)
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // --- Basic rendering ---
  describe('basic rendering', () => {
    it('renders the heading', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByText(/Situations que tu reconnais/)).toBeInTheDocument()
    })

    it('renders the subtitle', () => {
      render(<TestimonialCarousel />)
      expect(
        screen.getByText(/qui est dispo ce soir/)
      ).toBeInTheDocument()
    })

    it('has carousel role with aria-label', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByRole('region', { name: 'Situations de joueurs' })).toBeInTheDocument()
    })

    it('renders a slide group with aria-roledescription', () => {
      render(<TestimonialCarousel />)
      const group = screen.getByRole('group')
      expect(group).toHaveAttribute('aria-roledescription', 'slide')
    })
  })

  // --- Navigation buttons ---
  describe('navigation buttons', () => {
    it('renders previous button with correct aria-label', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByLabelText('Situation précédente')).toBeInTheDocument()
    })

    it('renders next button with correct aria-label', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByLabelText('Situation suivante')).toBeInTheDocument()
    })

    it('both buttons are type="button"', () => {
      render(<TestimonialCarousel />)
      const prevBtn = screen.getByLabelText('Situation précédente')
      const nextBtn = screen.getByLabelText('Situation suivante')
      expect(prevBtn).toHaveAttribute('type', 'button')
      expect(nextBtn).toHaveAttribute('type', 'button')
    })

    it('renders ChevronLeft icon in prev button', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByTestId('icon-chevron-left')).toBeInTheDocument()
    })

    it('renders ChevronRight icon in next button', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByTestId('icon-chevron-right')).toBeInTheDocument()
    })
  })

  // --- Scenario cards content ---
  describe('scenario cards', () => {
    it('renders the first scenario on initial load (mobile: 1 card)', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByText('Le message sans réponse')).toBeInTheDocument()
    })

    it('renders scenario avatar emoji', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByText('💬')).toBeInTheDocument()
    })

    it('renders scenario squad context', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByText('Chaque groupe Discord, chaque soir')).toBeInTheDocument()
    })

    it('renders scenario game info', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByText('Valorant')).toBeInTheDocument()
    })

    it('does not render star ratings', () => {
      render(<TestimonialCarousel />)
      expect(screen.queryByTestId('icon-star')).not.toBeInTheDocument()
    })

    it('renders scenario text', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByText(/On joue ce soir/)).toBeInTheDocument()
    })
  })

  // --- Next/Prev navigation ---
  describe('next/prev navigation', () => {
    it('clicking next shows the second scenario', () => {
      render(<TestimonialCarousel />)
      const nextBtn = screen.getByLabelText('Situation suivante')
      fireEvent.click(nextBtn)
      expect(screen.getByText('Le ghost du samedi soir')).toBeInTheDocument()
    })

    it('clicking prev from first goes to last slide (wraps around)', () => {
      render(<TestimonialCarousel />)
      const prevBtn = screen.getByLabelText('Situation précédente')
      fireEvent.click(prevBtn)
      // With 6 scenarios and 1 per view, last slide = "La squad éparpillée"
      expect(screen.getByText('La squad éparpillée')).toBeInTheDocument()
    })

    it('clicking next multiple times cycles through scenarios', () => {
      render(<TestimonialCarousel />)
      const nextBtn = screen.getByLabelText('Situation suivante')

      fireEvent.click(nextBtn)
      expect(screen.getByText('Le ghost du samedi soir')).toBeInTheDocument()

      fireEvent.click(nextBtn)
      expect(screen.getByText(/on verra demain/)).toBeInTheDocument()

      fireEvent.click(nextBtn)
      expect(screen.getByText('Le pote qui ghost')).toBeInTheDocument()
    })

    it('clicking next wraps back to first after last', () => {
      render(<TestimonialCarousel />)
      const nextBtn = screen.getByLabelText('Situation suivante')
      // Click 6 times to go through all 6 and wrap
      for (let i = 0; i < 6; i++) {
        fireEvent.click(nextBtn)
      }
      // Should be back at first
      expect(screen.getByText('Le message sans réponse')).toBeInTheDocument()
    })
  })

  // --- Dot indicators ---
  describe('dot indicators', () => {
    it('renders dot buttons for each slide group (6 for mobile)', () => {
      render(<TestimonialCarousel />)
      // 6 scenarios / 1 per view = 6 dots
      const dots = screen.getAllByLabelText(/Situation groupe/)
      expect(dots).toHaveLength(6)
    })

    it('dot buttons have correct aria-labels', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByLabelText('Situation groupe 1')).toBeInTheDocument()
      expect(screen.getByLabelText('Situation groupe 2')).toBeInTheDocument()
      expect(screen.getByLabelText('Situation groupe 6')).toBeInTheDocument()
    })

    it('clicking a dot navigates to that slide', () => {
      render(<TestimonialCarousel />)
      const dot3 = screen.getByLabelText('Situation groupe 3')
      fireEvent.click(dot3)
      // 3rd group (index 2) = "Le « on verra demain »"
      expect(screen.getByText(/on verra demain/)).toBeInTheDocument()
    })

    it('clicking a dot going forward sets direction to 1', () => {
      render(<TestimonialCarousel />)
      // Navigate to dot 4 from dot 1 (forward)
      const dot4 = screen.getByLabelText('Situation groupe 4')
      fireEvent.click(dot4)
      expect(screen.getByText('Le pote qui ghost')).toBeInTheDocument()
    })

    it('clicking a dot going backward sets direction to -1', () => {
      render(<TestimonialCarousel />)
      // First go forward
      const nextBtn = screen.getByLabelText('Situation suivante')
      fireEvent.click(nextBtn)
      fireEvent.click(nextBtn)
      // Now go back to dot 1
      const dot1 = screen.getByLabelText('Situation groupe 1')
      fireEvent.click(dot1)
      expect(screen.getByText('Le message sans réponse')).toBeInTheDocument()
    })
  })

  // --- Auto-advance ---
  describe('auto-advance', () => {
    it('auto-advances to next slide after 5 seconds', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByText('Le message sans réponse')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(screen.getByText('Le ghost du samedi soir')).toBeInTheDocument()
    })

    it('auto-advances multiple times', () => {
      render(<TestimonialCarousel />)

      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(screen.getByText('Le ghost du samedi soir')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(screen.getByText(/on verra demain/)).toBeInTheDocument()
    })
  })

  // --- Pause on hover ---
  describe('pause on hover', () => {
    it('pauses auto-advance on mouseEnter', () => {
      render(<TestimonialCarousel />)
      const carouselRegion = screen.getByRole('region', { name: 'Situations de joueurs' })
      // Get the hoverable container (the div with onMouseEnter)
      const hoverContainer = carouselRegion.querySelector('.relative')!
      fireEvent.mouseEnter(hoverContainer)

      act(() => {
        vi.advanceTimersByTime(10000)
      })
      // Should still be on first slide since paused
      expect(screen.getByText('Le message sans réponse')).toBeInTheDocument()
    })

    it('resumes auto-advance on mouseLeave', () => {
      render(<TestimonialCarousel />)
      const carouselRegion = screen.getByRole('region', { name: 'Situations de joueurs' })
      const hoverContainer = carouselRegion.querySelector('.relative')!

      fireEvent.mouseEnter(hoverContainer)
      act(() => {
        vi.advanceTimersByTime(10000)
      })
      // Still on first
      expect(screen.getByText('Le message sans réponse')).toBeInTheDocument()

      fireEvent.mouseLeave(hoverContainer)
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      // Should advance now
      expect(screen.getByText('Le ghost du samedi soir')).toBeInTheDocument()
    })
  })

  // --- Responsive cardsPerView ---
  describe('responsive cardsPerView', () => {
    it('shows 1 card on mobile (width < 768)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true })
      render(<TestimonialCarousel />)
      // 6 scenarios / 1 per view = 6 dots
      const dots = screen.getAllByLabelText(/Situation groupe/)
      expect(dots).toHaveLength(6)
    })

    it('shows 2 cards on tablet (768 <= width < 1024)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true })
      render(<TestimonialCarousel />)
      // Fire resize event to trigger recalculation
      fireEvent(window, new Event('resize'))
      // 6 / 2 = 3 dots
      const dots = screen.getAllByLabelText(/Situation groupe/)
      expect(dots).toHaveLength(3)
    })

    it('shows 3 cards on desktop (width >= 1024)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
      render(<TestimonialCarousel />)
      fireEvent(window, new Event('resize'))
      // 6 / 3 = 2 dots
      const dots = screen.getAllByLabelText(/Situation groupe/)
      expect(dots).toHaveLength(2)
    })

    it('applies grid-cols-1 class on mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true })
      render(<TestimonialCarousel />)
      const group = screen.getByRole('group')
      expect(group.className).toContain('grid-cols-1')
    })

    it('applies grid-cols-3 class on desktop', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
      render(<TestimonialCarousel />)
      fireEvent(window, new Event('resize'))
      const group = screen.getByRole('group')
      expect(group.className).toContain('grid-cols-3')
    })
  })

  // --- Slide aria-label ---
  describe('slide aria-label', () => {
    it('shows correct aria-label for current slide group (mobile)', () => {
      render(<TestimonialCarousel />)
      const group = screen.getByRole('group')
      expect(group).toHaveAttribute('aria-label', 'Situations 1 à 1 sur 6')
    })

    it('updates aria-label when navigating to next slide', () => {
      render(<TestimonialCarousel />)
      const nextBtn = screen.getByLabelText('Situation suivante')
      fireEvent.click(nextBtn)
      const group = screen.getByRole('group')
      expect(group).toHaveAttribute('aria-label', 'Situations 2 à 2 sur 6')
    })
  })

  // --- Multiple scenarios in desktop view ---
  describe('multiple visible scenarios', () => {
    it('shows 3 scenarios at once on desktop', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
      render(<TestimonialCarousel />)
      fireEvent(window, new Event('resize'))
      // First 3 scenarios should be visible
      expect(screen.getByText('Le message sans réponse')).toBeInTheDocument()
      expect(screen.getByText('Le ghost du samedi soir')).toBeInTheDocument()
      expect(screen.getByText(/on verra demain/)).toBeInTheDocument()
    })

    it('navigating next on desktop shows scenarios 4-6', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
      render(<TestimonialCarousel />)
      fireEvent(window, new Event('resize'))
      const nextBtn = screen.getByLabelText('Situation suivante')
      fireEvent.click(nextBtn)
      expect(screen.getByText('Le pote qui ghost')).toBeInTheDocument()
      expect(screen.getByText('Le 5e qui manque toujours')).toBeInTheDocument()
      expect(screen.getByText('La squad éparpillée')).toBeInTheDocument()
    })
  })
})
