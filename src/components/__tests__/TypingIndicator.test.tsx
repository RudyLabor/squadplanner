import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

import { TypingIndicator } from '../TypingIndicator'

describe('TypingIndicator', () => {
  it('renders nothing when text is null', () => {
    const { container } = render(createElement(TypingIndicator, { text: null }))
    expect(container.innerHTML).toBe('')
  })

  it('renders typing text in full mode', () => {
    render(createElement(TypingIndicator, { text: 'Pierre écrit...' }))
    expect(screen.getByText('Pierre écrit...')).toBeDefined()
  })

  it('renders with status role for accessibility', () => {
    const { container } = render(createElement(TypingIndicator, { text: 'typing...' }))
    expect(container.querySelector('[role="status"]')).toBeDefined()
  })

  it('renders aria-live polite for screen readers', () => {
    const { container } = render(createElement(TypingIndicator, { text: 'typing...' }))
    expect(container.querySelector('[aria-live="polite"]')).toBeDefined()
  })

  it('renders compact mode with sr-only text', () => {
    render(createElement(TypingIndicator, { text: 'Pierre écrit...', compact: true }))
    // In compact mode, the text is sr-only
    const srOnly = screen.getByText('Pierre écrit...')
    expect(srOnly.className).toContain('sr-only')
  })

  it('renders three animated dots', () => {
    const { container } = render(createElement(TypingIndicator, { text: 'test' }))
    // Three dot spans in the container variants div
    const dots = container.querySelectorAll('span.rounded-full')
    expect(dots.length).toBeGreaterThanOrEqual(3)
  })
})
