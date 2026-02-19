import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingMore } from '../LoadingMore'
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
  Loader2: (props: any) => createElement('svg', { ...props, 'data-testid': 'loader-icon' }),
}))

describe('LoadingMore', () => {
  // STRICT: default text, spinner present, correct structure
  it('renders with default text, spinning loader, and centered layout', () => {
    const { container } = render(<LoadingMore />)

    // Default text rendered as a span
    const textEl = screen.getByText('Chargement...')
    expect(textEl).toBeInTheDocument()
    expect(textEl.tagName).toBe('SPAN')

    // Loader icon is present (SVG spinner)
    const loader = screen.getByTestId('loader-icon')
    expect(loader).toBeInTheDocument()

    // Wrapper contains both the spinner and the text
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toContainElement(loader)
    expect(wrapper).toContainElement(textEl)
  })

  // STRICT: custom text is rendered, default text is not shown
  it('renders custom text instead of default', () => {
    render(<LoadingMore text="Chargement des messages..." />)

    expect(screen.getByText('Chargement des messages...')).toBeInTheDocument()
    expect(screen.queryByText('Chargement...')).not.toBeInTheDocument()

    // Loader still present
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
  })

  // STRICT: component structure is correct - single wrapper with spinner + text as children
  it('has correct DOM structure: wrapper > [spinner, text]', () => {
    const { container } = render(<LoadingMore text="Loading items" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toBeDefined()
    expect(wrapper.childNodes.length).toBe(2)

    // First child is the loader
    const firstChild = wrapper.childNodes[0] as HTMLElement
    expect(firstChild.tagName).toBe('svg')

    // Second child is the text span
    const secondChild = wrapper.childNodes[1] as HTMLElement
    expect(secondChild.tagName).toBe('SPAN')
    expect(secondChild.textContent).toBe('Loading items')
  })
})
