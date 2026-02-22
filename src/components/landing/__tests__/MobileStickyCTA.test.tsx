import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    createElement('span', { ...props, 'data-testid': 'arrow-icon' }, 'arrow'),
  X: (props: any) => createElement('span', { ...props, 'data-testid': 'x-icon' }, 'x'),
}))

import { MobileStickyCTA } from '../MobileStickyCTA'

// Helper to simulate scroll with both hero and pricing elements
function setupDOMElements() {
  const hero = document.createElement('div')
  hero.id = 'main-content'
  document.body.appendChild(hero)

  const pricing = document.createElement('div')
  pricing.id = 'pricing'
  document.body.appendChild(pricing)

  return { hero, pricing }
}

function cleanupDOMElements() {
  document.getElementById('main-content')?.remove()
  document.getElementById('pricing')?.remove()
}

function simulateScroll(heroBottom: number, pricingTop: number) {
  const hero = document.getElementById('main-content')
  const pricing = document.getElementById('pricing')

  if (hero) {
    vi.spyOn(hero, 'getBoundingClientRect').mockReturnValue({
      bottom: heroBottom,
      top: 0,
      left: 0,
      right: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
  }
  if (pricing) {
    vi.spyOn(pricing, 'getBoundingClientRect').mockReturnValue({
      bottom: 0,
      top: pricingTop,
      left: 0,
      right: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
  }
}

describe('MobileStickyCTA', () => {
  beforeEach(() => {
    setupDOMElements()
    // Set window.innerHeight
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
  })

  afterEach(() => {
    cleanupDOMElements()
    vi.restoreAllMocks()
  })

  it('renders without crash', () => {
    const { container } = render(<MobileStickyCTA />)
    expect(container).toBeDefined()
  })

  it('does not show CTA initially (isVisible=false)', () => {
    render(<MobileStickyCTA />)
    expect(screen.queryByText('Créer ma squad gratuitement')).not.toBeInTheDocument()
  })

  describe('Visibility based on scroll', () => {
    it('shows CTA when hero is scrolled past and pricing is not visible', () => {
      render(<MobileStickyCTA />)

      // Hero fully scrolled past (bottom < 0), pricing not yet visible (top > innerHeight)
      simulateScroll(-100, 1200)

      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })

      expect(screen.getByText('Créer ma squad gratuitement')).toBeInTheDocument()
    })

    it('hides CTA when hero is still visible', () => {
      render(<MobileStickyCTA />)

      // Hero still visible (bottom > 0)
      simulateScroll(100, 1200)

      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })

      expect(screen.queryByText('Créer ma squad gratuitement')).not.toBeInTheDocument()
    })

    it('hides CTA when pricing is visible', () => {
      render(<MobileStickyCTA />)

      // Hero scrolled past but pricing is visible (top < innerHeight)
      simulateScroll(-100, 600)

      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })

      expect(screen.queryByText('Créer ma squad gratuitement')).not.toBeInTheDocument()
    })
  })

  describe('Scroll without pricing element', () => {
    it('shows CTA based on hero only when pricing element is absent', () => {
      // Remove pricing element
      document.getElementById('pricing')?.remove()

      render(<MobileStickyCTA />)

      const hero = document.getElementById('main-content')
      if (hero) {
        vi.spyOn(hero, 'getBoundingClientRect').mockReturnValue({
          bottom: -100,
          top: 0,
          left: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        })
      }

      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })

      expect(screen.getByText('Créer ma squad gratuitement')).toBeInTheDocument()
    })
  })

  describe('Dismiss button', () => {
    it('renders dismiss button with Fermer label', () => {
      render(<MobileStickyCTA />)

      // Make CTA visible first
      simulateScroll(-100, 1200)
      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })

      expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
    })

    it('clicking dismiss hides the CTA permanently', async () => {
      const user = userEvent.setup()
      render(<MobileStickyCTA />)

      // Make CTA visible
      simulateScroll(-100, 1200)
      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })

      expect(screen.getByText('Créer ma squad gratuitement')).toBeInTheDocument()

      // Click dismiss
      await user.click(screen.getByLabelText('Fermer'))

      // CTA should be gone
      expect(screen.queryByText('Créer ma squad gratuitement')).not.toBeInTheDocument()

      // Even after scrolling again, it should stay hidden
      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })
      expect(screen.queryByText('Créer ma squad gratuitement')).not.toBeInTheDocument()
    })
  })

  describe('CTA link', () => {
    it('has correct href for registration', () => {
      render(<MobileStickyCTA />)

      simulateScroll(-100, 1200)
      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })

      const link = screen.getByText('Créer ma squad gratuitement').closest('a')
      expect(link).toHaveAttribute('href', '/auth?mode=register&redirect=onboarding')
    })

    it('has tracking attribute', () => {
      render(<MobileStickyCTA />)

      simulateScroll(-100, 1200)
      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })

      const link = screen.getByText('Créer ma squad gratuitement').closest('a')
      expect(link).toHaveAttribute('data-track', 'mobile_sticky_cta_click')
    })
  })

  describe('Icons', () => {
    it('renders ArrowRight icon in CTA', () => {
      render(<MobileStickyCTA />)

      simulateScroll(-100, 1200)
      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })

      expect(screen.getByTestId('arrow-icon')).toBeInTheDocument()
    })

    it('renders X icon in dismiss button', () => {
      render(<MobileStickyCTA />)

      simulateScroll(-100, 1200)
      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })

      expect(screen.getByTestId('x-icon')).toBeInTheDocument()
    })
  })

  describe('Cleanup', () => {
    it('removes scroll listener on unmount', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener')
      const { unmount } = render(<MobileStickyCTA />)
      unmount()

      expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
      removeSpy.mockRestore()
    })
  })
})
