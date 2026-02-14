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
  Badge: ({ children, ...props }: any) => createElement('span', props, children),
  SessionCardSkeleton: () => createElement('div', { 'data-testid': 'skeleton' }),
  ContentTransition: ({ children, isLoading, skeleton }: any) => isLoading ? skeleton : children,
}))

vi.mock('../types', () => ({
  formatDate: (d: string) => new Date(d).toLocaleDateString('fr-FR'),
}))

import { ConfirmedSessions, HowItWorksSection } from '../ConfirmedSessions'

describe('ConfirmedSessions', () => {
  it('renders empty state when no sessions', () => {
    render(<ConfirmedSessions confirmed={[]} sessionsLoading={false} />)
    expect(screen.getByText('Aucune session confirmée')).toBeTruthy()
  })

  it('renders sessions when provided', () => {
    const sessions = [{ id: 's1', title: 'Ranked Soir', scheduled_at: '2026-02-14T21:00:00Z', rsvp_counts: { present: 3 } }]
    render(<ConfirmedSessions confirmed={sessions} sessionsLoading={false} />)
    expect(screen.getByText('Ranked Soir')).toBeTruthy()
  })
})

describe('HowItWorksSection', () => {
  it('renders without crashing', () => {
    const { container } = render(<HowItWorksSection />)
    expect(container).toBeTruthy()
  })

  it('renders steps', () => {
    render(<HowItWorksSection />)
    expect(screen.getByText(/Un membre de ta squad propose/)).toBeTruthy()
  })
})
