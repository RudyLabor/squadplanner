import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
  Button: ({ children, ...props }: any) => createElement('button', props, children),
}))

vi.mock('../../../components/ui/Tooltip', () => ({
  Tooltip: ({ children }: any) => children,
}))

vi.mock('../../../hooks/useCallHistory', () => ({
  formatDuration: (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
  formatRelativeTime: () => 'il y a 5min',
}))

import { CallHistoryList } from '../CallHistoryList'

describe('CallHistoryList', () => {
  const defaultProps = {
    filteredCalls: [],
    filter: 'all',
    callStatus: 'idle',
    onCall: vi.fn(),
  }

  it('renders empty state when no calls', () => {
    render(<CallHistoryList {...defaultProps} />)
    expect(screen.getByText(/Prêt à appeler ta squad/)).toBeTruthy()
  })

  it('renders empty state with filter message', () => {
    render(<CallHistoryList {...defaultProps} filter="incoming" />)
    expect(screen.getByText(/Rien pour le moment/)).toBeTruthy()
  })

  it('renders calls when provided', () => {
    const calls = [{
      id: '1',
      type: 'incoming' as const,
      status: 'completed',
      contactId: 'c1',
      contactName: 'TestUser',
      contactAvatar: null,
      durationSeconds: 120,
      createdAt: new Date().toISOString(),
    }]
    render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
    expect(screen.getByText('TestUser')).toBeTruthy()
  })
})
