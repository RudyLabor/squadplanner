import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'

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

import { CalendarIllustration } from '../illustrations/CalendarIllustration'
import { GamingHeroIllustration } from '../illustrations/GamingHeroIllustration'
import { HeadphonesIllustration } from '../illustrations/HeadphonesIllustration'
import { ShieldIllustration } from '../illustrations/ShieldIllustration'

describe('CalendarIllustration', () => {
  it('renders without crashing', () => {
    const { container } = render(<CalendarIllustration />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    const { container } = render(<CalendarIllustration size={128} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '128')
    expect(svg).toHaveAttribute('height', '128')
  })

  it('applies custom className', () => {
    const { container } = render(<CalendarIllustration className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('has illustration-themed class', () => {
    const { container } = render(<CalendarIllustration />)
    expect(container.firstChild).toHaveClass('illustration-themed')
  })

  it('uses default size of 64', () => {
    const { container } = render(<CalendarIllustration />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '64')
    expect(svg).toHaveAttribute('height', '64')
  })
})

describe('GamingHeroIllustration', () => {
  it('renders without crashing', () => {
    const { container } = render(<GamingHeroIllustration />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    const { container } = render(<GamingHeroIllustration size={400} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '400')
    expect(svg).toHaveAttribute('height', '400')
  })

  it('applies custom className', () => {
    const { container } = render(<GamingHeroIllustration className="hero-custom" />)
    expect(container.firstChild).toHaveClass('hero-custom')
  })

  it('uses default size of 300', () => {
    const { container } = render(<GamingHeroIllustration />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '300')
    expect(svg).toHaveAttribute('height', '300')
  })

  it('contains defs with gradients', () => {
    const { container } = render(<GamingHeroIllustration />)
    expect(container.querySelector('defs')).toBeInTheDocument()
  })
})

describe('HeadphonesIllustration', () => {
  it('renders without crashing', () => {
    const { container } = render(<HeadphonesIllustration />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    const { container } = render(<HeadphonesIllustration size={96} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '96')
    expect(svg).toHaveAttribute('height', '96')
  })

  it('applies custom className', () => {
    const { container } = render(<HeadphonesIllustration className="headphones-test" />)
    expect(container.firstChild).toHaveClass('headphones-test')
  })

  it('uses default size of 64', () => {
    const { container } = render(<HeadphonesIllustration />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '64')
  })
})

describe('ShieldIllustration', () => {
  it('renders without crashing', () => {
    const { container } = render(<ShieldIllustration />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    const { container } = render(<ShieldIllustration size={48} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '48')
    expect(svg).toHaveAttribute('height', '48')
  })

  it('applies custom className', () => {
    const { container } = render(<ShieldIllustration className="shield-test" />)
    expect(container.firstChild).toHaveClass('shield-test')
  })

  it('uses default size of 64', () => {
    const { container } = render(<ShieldIllustration />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '64')
  })
})
