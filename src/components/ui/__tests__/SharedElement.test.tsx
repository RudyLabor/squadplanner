import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SharedElement } from '../SharedElement'
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

describe('SharedElement', () => {
  // STRICT: renders children, aria-hidden=true for decorative element, has layoutId, className applied
  it('renders children with correct accessibility and layout attributes', () => {
    const { container } = render(
      <SharedElement id="hero-image" className="shared-hero">
        <img src="/hero.jpg" alt="Hero" />
      </SharedElement>
    )

    // Children rendered
    expect(screen.getByAltText('Hero')).toBeInTheDocument()

    // Wrapper is aria-hidden (decorative animation wrapper)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveAttribute('aria-hidden', 'true')

    // className applied
    expect(wrapper).toHaveClass('shared-hero')

    // layoutId passed through (rendered as attribute by mock)
    expect(wrapper).toHaveAttribute('layoutid', 'hero-image')

    // layout prop passed
    expect(wrapper).toHaveAttribute('layout', 'position')
  })

  // STRICT: different IDs produce different layoutId values, children are independent
  it('supports multiple instances with different IDs', () => {
    const { container } = render(
      <div>
        <SharedElement id="card-1" className="card">
          <span>Card One</span>
        </SharedElement>
        <SharedElement id="card-2" className="card">
          <span>Card Two</span>
        </SharedElement>
      </div>
    )

    expect(screen.getByText('Card One')).toBeInTheDocument()
    expect(screen.getByText('Card Two')).toBeInTheDocument()

    const sharedElements = container.querySelectorAll('[aria-hidden="true"]')
    expect(sharedElements.length).toBe(2)

    expect(sharedElements[0]).toHaveAttribute('layoutid', 'card-1')
    expect(sharedElements[1]).toHaveAttribute('layoutid', 'card-2')

    // Both have the same className
    expect(sharedElements[0]).toHaveClass('card')
    expect(sharedElements[1]).toHaveClass('card')
  })

  // STRICT: renders without className, passes extra HTML motion props, wrapper is a div
  it('renders correctly without optional className and with extra props', () => {
    const { container } = render(
      <SharedElement id="minimal" data-testid="shared-el">
        Simple text
      </SharedElement>
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.tagName).toBe('DIV')
    expect(wrapper).toHaveAttribute('aria-hidden', 'true')
    expect(wrapper).toHaveAttribute('layoutid', 'minimal')
    expect(screen.getByText('Simple text')).toBeInTheDocument()

    // data-testid passed through via spread props
    expect(screen.getByTestId('shared-el')).toBeInTheDocument()

    // No className attribute when not provided
    expect(wrapper.className).toBe('')
  })
})
