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
          ? ({ children, style, ...r }: any) => createElement(p, { ...r, style }, children)
          : undefined,
    }
  ),
  motion: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, style, ...r }: any) => createElement(p, { ...r, style }, children)
          : undefined,
    }
  ),
}))

vi.mock('../../icons', () => ({
  MousePointerClick: (props: any) =>
    createElement(
      'span',
      { ...props, 'data-testid': 'icon-mousepointerclick' },
      'MousePointerClick'
    ),
  Clock: (props: any) => createElement('span', { ...props, 'data-testid': 'icon-clock' }, 'Clock'),
  Smile: (props: any) => createElement('span', { ...props, 'data-testid': 'icon-smile' }, 'Smile'),
  Target: (props: any) =>
    createElement('span', { ...props, 'data-testid': 'icon-target' }, 'Target'),
}))

vi.mock('../../ui/AnimatedCounter', () => ({
  AnimatedCounter: ({
    end,
    suffix,
    singularSuffix,
    separator,
    className,
    duration,
    decimals,
  }: any) =>
    createElement(
      'span',
      { className, 'data-testid': 'animated-counter' },
      `${end}${suffix || ''}`
    ),
}))

import { SocialProofSection } from '../SocialProofSection'

describe('SocialProofSection', () => {
  it('renders section with correct aria-label', () => {
    render(<SocialProofSection />)
    expect(screen.getByLabelText('Statistiques')).toBeInTheDocument()
  })

  describe('Stat cards', () => {
    it('renders all 4 stat cards', () => {
      render(<SocialProofSection />)
      const counters = screen.getAllByTestId('animated-counter')
      expect(counters.length).toBe(4)
    })

    it('renders stat labels', () => {
      render(<SocialProofSection />)
      expect(screen.getByText('pour confirmer ta présence')).toBeInTheDocument()
      expect(screen.getByText('pour organiser toutes tes sessions')).toBeInTheDocument()
      expect(screen.getByText('prise de tête pour planifier')).toBeInTheDocument()
      expect(screen.getByText('satisfaction beta testeurs')).toBeInTheDocument()
    })

    it('renders stat values correctly', () => {
      render(<SocialProofSection />)
      expect(screen.getByText('1 clic')).toBeInTheDocument()
      expect(screen.getByText('1 min/sem')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('4.9★')).toBeInTheDocument()
    })
  })

  describe('Icons', () => {
    it('renders all 4 stat icons', () => {
      render(<SocialProofSection />)
      expect(screen.getByTestId('icon-mousepointerclick')).toBeInTheDocument()
      expect(screen.getByTestId('icon-clock')).toBeInTheDocument()
      expect(screen.getByTestId('icon-smile')).toBeInTheDocument()
      expect(screen.getByTestId('icon-target')).toBeInTheDocument()
    })

    it('icons have aria-hidden="true"', () => {
      render(<SocialProofSection />)
      expect(screen.getByTestId('icon-mousepointerclick')).toHaveAttribute('aria-hidden', 'true')
      expect(screen.getByTestId('icon-clock')).toHaveAttribute('aria-hidden', 'true')
      expect(screen.getByTestId('icon-smile')).toHaveAttribute('aria-hidden', 'true')
      expect(screen.getByTestId('icon-target')).toHaveAttribute('aria-hidden', 'true')
    })

    it('icons have custom colors via style prop', () => {
      render(<SocialProofSection />)
      expect(screen.getByTestId('icon-mousepointerclick')).toHaveStyle({
        color: 'var(--color-secondary)',
      })
      expect(screen.getByTestId('icon-clock')).toHaveStyle({ color: 'var(--color-primary)' })
      expect(screen.getByTestId('icon-smile')).toHaveStyle({ color: 'var(--color-gold)' })
      expect(screen.getByTestId('icon-target')).toHaveStyle({ color: 'var(--color-success)' })
    })
  })

  describe('Pulse indicators', () => {
    it('renders 4 green pulse dots', () => {
      const { container } = render(<SocialProofSection />)
      const pulseDots = container.querySelectorAll('.animate-pulse')
      expect(pulseDots.length).toBe(4)
    })
  })

  describe('Layout structure', () => {
    it('has max-w-4xl container', () => {
      const { container } = render(<SocialProofSection />)
      expect(container.querySelector('.max-w-4xl')).toBeInTheDocument()
    })

    it('has responsive grid (2 cols on mobile, 4 on md)', () => {
      const { container } = render(<SocialProofSection />)
      const grid = container.querySelector('.grid.grid-cols-2.md\\:grid-cols-4')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('AnimatedCounter props', () => {
    it('passes correct props to AnimatedCounter components', () => {
      render(<SocialProofSection />)
      const counters = screen.getAllByTestId('animated-counter')
      // All counters should have the font classes
      counters.forEach((counter) => {
        expect(counter.className).toContain('font-bold')
      })
    })
  })
})
