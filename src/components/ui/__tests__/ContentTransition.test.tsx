import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContentTransition } from '../ContentTransition'
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

describe('ContentTransition', () => {
  it('shows skeleton when loading', () => {
    render(
      <ContentTransition isLoading={true} skeleton={<div>Loading...</div>}>
        <div>Content</div>
      </ContentTransition>
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('shows children when not loading', () => {
    render(
      <ContentTransition isLoading={false} skeleton={<div>Loading...</div>}>
        <div>Content</div>
      </ContentTransition>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('sets aria-busy when loading', () => {
    const { container } = render(
      <ContentTransition isLoading={true} skeleton={<div>Skel</div>}>
        <div>Content</div>
      </ContentTransition>
    )
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true')
  })

  it('unsets aria-busy when loaded', () => {
    const { container } = render(
      <ContentTransition isLoading={false} skeleton={<div>Skel</div>}>
        <div>Content</div>
      </ContentTransition>
    )
    expect(container.firstChild).toHaveAttribute('aria-busy', 'false')
  })
})
