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

vi.mock('../gifApi', () => ({
  searchGifs: vi.fn().mockResolvedValue([]),
  fetchTrendingGifs: vi.fn().mockResolvedValue([]),
  CATEGORIES: [
    { label: 'GG', query: 'gg gaming' },
    { label: 'Rage', query: 'rage gaming' },
  ],
}))

vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
}))

import { GifPicker } from '../GifPicker'

describe('GifPicker', () => {
  const defaultProps = {
    isOpen: true,
    onSelect: vi.fn(),
    onClose: vi.fn(),
  }

  it('renders when open', () => {
    render(<GifPicker {...defaultProps} />)
    expect(screen.getByText('GIFs')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<GifPicker {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('GIFs')).not.toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<GifPicker {...defaultProps} />)
    expect(screen.getByPlaceholderText('Chercher un GIF...')).toBeInTheDocument()
  })

  it('renders category buttons', () => {
    render(<GifPicker {...defaultProps} />)
    expect(screen.getByText('GG')).toBeInTheDocument()
    expect(screen.getByText('Rage')).toBeInTheDocument()
  })

  it('shows Powered by Tenor', () => {
    render(<GifPicker {...defaultProps} />)
    expect(screen.getByText('Powered by Tenor')).toBeInTheDocument()
  })
})
