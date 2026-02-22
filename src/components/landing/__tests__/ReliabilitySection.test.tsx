import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

vi.mock('../../../utils/animations', () => ({
  scaleReveal: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
}))

import { ReliabilitySection } from '../ReliabilitySection'

describe('ReliabilitySection', () => {
  it('renders section with correct aria-label', () => {
    render(<ReliabilitySection />)
    expect(screen.getByLabelText('Score de fiabilité')).toBeInTheDocument()
  })

  it('renders the heading', () => {
    render(<ReliabilitySection />)
    expect(screen.getByText(/Score de fiabilité : tes potes comptent sur toi/)).toBeInTheDocument()
  })

  it('renders the description paragraph', () => {
    render(<ReliabilitySection />)
    expect(
      screen.getByText(/Chaque membre a un score basé sur sa présence réelle/)
    ).toBeInTheDocument()
  })

  it('renders the no-show warning in error color', () => {
    render(<ReliabilitySection />)
    expect(screen.getByText(/Les no-shows chroniques, ça se voit./)).toBeInTheDocument()
  })

  describe('Score circle', () => {
    it('renders 94% score', () => {
      render(<ReliabilitySection />)
      expect(screen.getByText('94%')).toBeInTheDocument()
    })

    it('renders fiabilité label', () => {
      render(<ReliabilitySection />)
      expect(screen.getByText('fiabilité')).toBeInTheDocument()
    })

    it('renders SVG circle chart with aria-hidden', () => {
      const { container } = render(<ReliabilitySection />)
      const svg = container.querySelector('svg.w-28.h-28')
      expect(svg).toBeInTheDocument()
      expect(svg?.getAttribute('aria-hidden')).toBe('true')
    })

    it('renders background and foreground circles', () => {
      const { container } = render(<ReliabilitySection />)
      const circles = container.querySelectorAll('circle')
      expect(circles.length).toBe(2) // background + animated foreground
    })
  })

  describe('History emojis', () => {
    it('renders 6 history emojis (5 checkmarks and 1 X)', () => {
      render(<ReliabilitySection />)
      const checkmarks = screen.getAllByText('✅')
      const crosses = screen.getAllByText('❌')
      expect(checkmarks.length).toBe(5)
      expect(crosses.length).toBe(1)
    })
  })

  describe('User label', () => {
    it('renders the username MaxGamer_94', () => {
      render(<ReliabilitySection />)
      expect(screen.getByText('MaxGamer_94')).toBeInTheDocument()
    })
  })

  describe('Feature badges', () => {
    it('renders all 3 feature badges', () => {
      render(<ReliabilitySection />)
      expect(screen.getByText(/Check-in obligatoire/)).toBeInTheDocument()
      expect(screen.getByText(/Historique visible/)).toBeInTheDocument()
      expect(screen.getByText(/Score par joueur/)).toBeInTheDocument()
    })

    it('renders feature badge icons', () => {
      render(<ReliabilitySection />)
      // ✅ appears in both history (5x) and badge (1x) = 6 total
      expect(screen.getAllByText(/✅/).length).toBe(6)
      expect(screen.getByText(/📊/)).toBeInTheDocument()
      expect(screen.getByText(/🏆/)).toBeInTheDocument()
    })
  })

  describe('Layout structure', () => {
    it('has max-w-4xl container', () => {
      const { container } = render(<ReliabilitySection />)
      expect(container.querySelector('.max-w-4xl')).toBeInTheDocument()
    })

    it('has responsive flex layout', () => {
      const { container } = render(<ReliabilitySection />)
      const flexContainer = container.querySelector('.flex.flex-col.md\\:flex-row')
      expect(flexContainer).toBeInTheDocument()
    })

    it('has responsive text alignment', () => {
      const { container } = render(<ReliabilitySection />)
      const textBlock = container.querySelector('.text-center.md\\:text-left')
      expect(textBlock).toBeInTheDocument()
    })
  })
})
