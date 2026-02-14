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

vi.mock('../../icons', () => ({
  User: (props: any) => createElement('span', props, 'user'),
  Zap: (props: any) => createElement('span', props, 'zap'),
}))

vi.mock('../../../utils/avatarUrl', () => ({
  getOptimizedAvatarUrl: vi.fn().mockReturnValue('https://cdn.test/avatar.jpg'),
}))

vi.mock('../../ui/Tooltip', () => ({
  Tooltip: ({ children }: any) => children,
}))

vi.mock('../../StatusSelector', () => ({
  StatusSelector: () => createElement('div', null, 'StatusSelector'),
}))

import { SidebarFooter } from '../SidebarFooter'

describe('SidebarFooter', () => {
  it('renders without crash (expanded)', () => {
    render(
      <SidebarFooter
        isExpanded={true}
        profile={{ username: 'TestUser', avatar_url: null, reliability_score: 95 }}
        onOpenCustomStatus={vi.fn()}
      />
    )
    expect(screen.getByText('TestUser')).toBeInTheDocument()
  })

  it('renders reliability score', () => {
    render(
      <SidebarFooter
        isExpanded={true}
        profile={{ username: 'TestUser', avatar_url: null, reliability_score: 95 }}
        onOpenCustomStatus={vi.fn()}
      />
    )
    expect(screen.getByText('95% fiable')).toBeInTheDocument()
  })

  it('renders premium upsell when expanded', () => {
    render(
      <SidebarFooter
        isExpanded={true}
        profile={{ username: 'TestUser', avatar_url: null, reliability_score: 100 }}
        onOpenCustomStatus={vi.fn()}
      />
    )
    expect(screen.getByText('Passe Premium')).toBeInTheDocument()
  })
})
