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
  Star: (props: any) => createElement('span', { ...props, 'data-testid': 'icon-star' }, 'star'),
  ChevronLeft: (props: any) => createElement('span', { ...props, 'data-testid': 'icon-chevron-left' }, 'left'),
  ChevronRight: (props: any) => createElement('span', { ...props, 'data-testid': 'icon-chevron-right' }, 'right'),
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

  // ─── Basic rendering ────────────────────────────────
  describe('basic rendering', () => {
    it('renders the heading', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByText('Nos joueurs en parlent mieux que nous')).toBeInTheDocument()
    })

    it('renders the subtitle', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByText('Bêta en cours — premiers retours de nos testeurs')).toBeInTheDocument()
    })

    it('has carousel role with aria-label', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByRole('region', { name: 'Témoignages de joueurs' })).toBeInTheDocument()
    })

    it('renders a slide group with aria-roledescription', () => {
      render(<TestimonialCarousel />)
      const group = screen.getByRole('group')
      expect(group).toHaveAttribute('aria-roledescription', 'slide')
    })
  })

  // ─── Navigation buttons ─────────────────────────────
  describe('navigation buttons', () => {
    it('renders previous button with correct aria-label', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByLabelText('Témoignage précédent')).toBeInTheDocument()
    })

    it('renders next button with correct aria-label', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByLabelText('Témoignage suivant')).toBeInTheDocument()
    })

    it('both buttons are type="button"', () => {
      render(<TestimonialCarousel />)
      const prevBtn = screen.getByLabelText('Témoignage précédent')
      const nextBtn = screen.getByLabelText('Témoignage suivant')
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

  // ─── Testimonial cards content ──────────────────────
  describe('testimonial cards', () => {
    it('renders the first testimonial on initial load (mobile: 1 card)', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByText('Gamer anonyme')).toBeInTheDocument()
    })

    it('renders testimonial avatar emoji', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByText('💬')).toBeInTheDocument()
    })

    it('renders testimonial squad name', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByText('Sur Discord, chaque soir')).toBeInTheDocument()
    })

    it('renders testimonial game info', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByText('Valorant')).toBeInTheDocument()
    })

    it('renders star rating icons (5 stars per card)', () => {
      render(<TestimonialCarousel />)
      const stars = screen.getAllByTestId('icon-star')
      expect(stars.length).toBe(5) // 5 stars for first card
    })

    it('renders filled stars based on rating', () => {
      render(<TestimonialCarousel />)
      const stars = screen.getAllByTestId('icon-star')
      // First testimonial has rating 5, so all 5 should be filled
      stars.forEach((star) => {
        expect(star.className).toContain('text-warning')
        expect(star.className).toContain('fill-warning')
      })
    })

    it('renders testimonial text wrapped in quotes', () => {
      render(<TestimonialCarousel />)
      // The first testimonial text contains specific content
      expect(screen.getByText(/On joue ce soir/)).toBeInTheDocument()
    })
  })

  // ─── Next/Prev navigation ──────────────────────────
  describe('next/prev navigation', () => {
    it('clicking next shows the second testimonial', () => {
      render(<TestimonialCarousel />)
      const nextBtn = screen.getByLabelText('Témoignage suivant')
      fireEvent.click(nextBtn)
      expect(screen.getByText('Bêta-testeur #12')).toBeInTheDocument()
    })

    it('clicking prev from first goes to last slide (wraps around)', () => {
      render(<TestimonialCarousel />)
      const prevBtn = screen.getByLabelText('Témoignage précédent')
      fireEvent.click(prevBtn)
      // With 6 testimonials and 1 per view, last slide = index 5 = "Bêta-testeur #19"
      expect(screen.getByText('Bêta-testeur #19')).toBeInTheDocument()
    })

    it('clicking next multiple times cycles through testimonials', () => {
      render(<TestimonialCarousel />)
      const nextBtn = screen.getByLabelText('Témoignage suivant')

      fireEvent.click(nextBtn)
      expect(screen.getByText('Bêta-testeur #12')).toBeInTheDocument()

      fireEvent.click(nextBtn)
      expect(screen.getByText('Bêta-testeur #7')).toBeInTheDocument()

      fireEvent.click(nextBtn)
      expect(screen.getByText('Tout gamer, ever')).toBeInTheDocument()
    })

    it('clicking next wraps back to first after last', () => {
      render(<TestimonialCarousel />)
      const nextBtn = screen.getByLabelText('Témoignage suivant')
      // Click 6 times to go through all 6 and wrap
      for (let i = 0; i < 6; i++) {
        fireEvent.click(nextBtn)
      }
      // Should be back at first
      expect(screen.getByText('Gamer anonyme')).toBeInTheDocument()
    })
  })

  // ─── Dot indicators ─────────────────────────────────
  describe('dot indicators', () => {
    it('renders dot buttons for each slide group (6 for mobile)', () => {
      render(<TestimonialCarousel />)
      // 6 testimonials / 1 per view = 6 dots
      const dots = screen.getAllByLabelText(/Témoignage groupe/)
      expect(dots).toHaveLength(6)
    })

    it('dot buttons have correct aria-labels', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByLabelText('Témoignage groupe 1')).toBeInTheDocument()
      expect(screen.getByLabelText('Témoignage groupe 2')).toBeInTheDocument()
      expect(screen.getByLabelText('Témoignage groupe 6')).toBeInTheDocument()
    })

    it('clicking a dot navigates to that slide', () => {
      render(<TestimonialCarousel />)
      const dot3 = screen.getByLabelText('Témoignage groupe 3')
      fireEvent.click(dot3)
      // 3rd group (index 2) = "Bêta-testeur #7"
      expect(screen.getByText('Bêta-testeur #7')).toBeInTheDocument()
    })

    it('clicking a dot going forward sets direction to 1', () => {
      render(<TestimonialCarousel />)
      // Navigate to dot 4 from dot 1 (forward)
      const dot4 = screen.getByLabelText('Témoignage groupe 4')
      fireEvent.click(dot4)
      expect(screen.getByText('Tout gamer, ever')).toBeInTheDocument()
    })

    it('clicking a dot going backward sets direction to -1', () => {
      render(<TestimonialCarousel />)
      // First go forward
      const nextBtn = screen.getByLabelText('Témoignage suivant')
      fireEvent.click(nextBtn)
      fireEvent.click(nextBtn)
      // Now go back to dot 1
      const dot1 = screen.getByLabelText('Témoignage groupe 1')
      fireEvent.click(dot1)
      expect(screen.getByText('Gamer anonyme')).toBeInTheDocument()
    })
  })

  // ─── Auto-advance ───────────────────────────────────
  describe('auto-advance', () => {
    it('auto-advances to next slide after 5 seconds', () => {
      render(<TestimonialCarousel />)
      expect(screen.getByText('Gamer anonyme')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(screen.getByText('Bêta-testeur #12')).toBeInTheDocument()
    })

    it('auto-advances multiple times', () => {
      render(<TestimonialCarousel />)

      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(screen.getByText('Bêta-testeur #12')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(screen.getByText('Bêta-testeur #7')).toBeInTheDocument()
    })
  })

  // ─── Pause on hover ────────────────────────────────
  describe('pause on hover', () => {
    it('pauses auto-advance on mouseEnter', () => {
      render(<TestimonialCarousel />)
      const carouselRegion = screen.getByRole('region', { name: 'Témoignages de joueurs' })
      // Get the hoverable container (the div with onMouseEnter)
      const hoverContainer = carouselRegion.querySelector('.relative')!
      fireEvent.mouseEnter(hoverContainer)

      act(() => {
        vi.advanceTimersByTime(10000)
      })
      // Should still be on first slide since paused
      expect(screen.getByText('Gamer anonyme')).toBeInTheDocument()
    })

    it('resumes auto-advance on mouseLeave', () => {
      render(<TestimonialCarousel />)
      const carouselRegion = screen.getByRole('region', { name: 'Témoignages de joueurs' })
      const hoverContainer = carouselRegion.querySelector('.relative')!

      fireEvent.mouseEnter(hoverContainer)
      act(() => {
        vi.advanceTimersByTime(10000)
      })
      // Still on first
      expect(screen.getByText('Gamer anonyme')).toBeInTheDocument()

      fireEvent.mouseLeave(hoverContainer)
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      // Should advance now
      expect(screen.getByText('Bêta-testeur #12')).toBeInTheDocument()
    })
  })

  // ─── Responsive cardsPerView ────────────────────────
  describe('responsive cardsPerView', () => {
    it('shows 1 card on mobile (width < 768)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true })
      render(<TestimonialCarousel />)
      // 6 testimonials / 1 per view = 6 dots
      const dots = screen.getAllByLabelText(/Témoignage groupe/)
      expect(dots).toHaveLength(6)
    })

    it('shows 2 cards on tablet (768 <= width < 1024)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true })
      render(<TestimonialCarousel />)
      // Fire resize event to trigger recalculation
      fireEvent(window, new Event('resize'))
      // 6 / 2 = 3 dots
      const dots = screen.getAllByLabelText(/Témoignage groupe/)
      expect(dots).toHaveLength(3)
    })

    it('shows 3 cards on desktop (width >= 1024)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
      render(<TestimonialCarousel />)
      fireEvent(window, new Event('resize'))
      // 6 / 3 = 2 dots
      const dots = screen.getAllByLabelText(/Témoignage groupe/)
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

  // ─── Slide aria-label ──────────────────────────────
  describe('slide aria-label', () => {
    it('shows correct aria-label for current slide group (mobile)', () => {
      render(<TestimonialCarousel />)
      const group = screen.getByRole('group')
      expect(group).toHaveAttribute('aria-label', 'Témoignages 1 à 1 sur 6')
    })

    it('updates aria-label when navigating to next slide', () => {
      render(<TestimonialCarousel />)
      const nextBtn = screen.getByLabelText('Témoignage suivant')
      fireEvent.click(nextBtn)
      const group = screen.getByRole('group')
      expect(group).toHaveAttribute('aria-label', 'Témoignages 2 à 2 sur 6')
    })
  })

  // ─── Rating display variations ─────────────────────
  describe('rating display', () => {
    it('testimonial with rating 4 shows 4 filled and 1 unfilled star', () => {
      render(<TestimonialCarousel />)
      // Navigate to the 5th testimonial (rating 4) - Bêta-testeur #3
      const nextBtn = screen.getByLabelText('Témoignage suivant')
      for (let i = 0; i < 4; i++) {
        fireEvent.click(nextBtn)
      }
      const stars = screen.getAllByTestId('icon-star')
      expect(stars).toHaveLength(5)
      // First 4 should be filled, last one should be unfilled
      const filledStars = stars.filter(s => s.className.includes('text-warning'))
      const unfilledStars = stars.filter(s => s.className.includes('text-border-subtle'))
      expect(filledStars).toHaveLength(4)
      expect(unfilledStars).toHaveLength(1)
    })
  })

  // ─── Multiple testimonials in desktop view ─────────
  describe('multiple visible testimonials', () => {
    it('shows 3 testimonials at once on desktop', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
      render(<TestimonialCarousel />)
      fireEvent(window, new Event('resize'))
      // First 3 testimonials should be visible
      expect(screen.getByText('Gamer anonyme')).toBeInTheDocument()
      expect(screen.getByText('Bêta-testeur #12')).toBeInTheDocument()
      expect(screen.getByText('Bêta-testeur #7')).toBeInTheDocument()
    })

    it('navigating next on desktop shows testimonials 4-6', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
      render(<TestimonialCarousel />)
      fireEvent(window, new Event('resize'))
      const nextBtn = screen.getByLabelText('Témoignage suivant')
      fireEvent.click(nextBtn)
      expect(screen.getByText('Tout gamer, ever')).toBeInTheDocument()
      expect(screen.getByText('Bêta-testeur #3')).toBeInTheDocument()
      expect(screen.getByText('Bêta-testeur #19')).toBeInTheDocument()
    })
  })
})
