import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

vi.mock('../ui', () => ({
  Button: ({ children, onClick, ...props }: any) =>
    createElement('button', { onClick, ...props }, children),
}))

import { EmptyState } from '../EmptyState'

describe('EmptyState', () => {
  it('renders generic empty state by default', () => {
    render(<EmptyState />)
    expect(screen.getByText('Rien à afficher')).toBeInTheDocument()
  })

  it('renders no_squads type', () => {
    render(<EmptyState type="no_squads" />)
    expect(screen.getByText('Pas encore de squad')).toBeInTheDocument()
  })

  it('renders no_sessions type', () => {
    render(<EmptyState type="no_sessions" />)
    expect(screen.getByText('Aucune session prévue')).toBeInTheDocument()
  })

  it('renders no_messages type', () => {
    render(<EmptyState type="no_messages" />)
    expect(screen.getByText('Pas encore de messages')).toBeInTheDocument()
  })

  it('renders no_search_results type', () => {
    render(<EmptyState type="no_search_results" />)
    expect(screen.getByText('Aucun résultat')).toBeInTheDocument()
  })

  it('uses custom title when provided', () => {
    render(<EmptyState title="Custom Title" />)
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('uses custom message when provided', () => {
    render(<EmptyState message="Custom message text" />)
    expect(screen.getByText('Custom message text')).toBeInTheDocument()
  })

  it('renders action button when onAction and actionLabel provided', () => {
    const onAction = vi.fn()
    render(<EmptyState onAction={onAction} actionLabel="Click me" />)
    const btn = screen.getByText('Click me')
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(onAction).toHaveBeenCalled()
  })

  it('does not render action button without onAction', () => {
    render(<EmptyState actionLabel="Click me" />)
    expect(screen.queryByText('Click me')).not.toBeInTheDocument()
  })

  it('renders default action label from config', () => {
    const onAction = vi.fn()
    render(<EmptyState type="no_squads" onAction={onAction} />)
    expect(screen.getByText('Créer ma squad')).toBeInTheDocument()
  })
})
