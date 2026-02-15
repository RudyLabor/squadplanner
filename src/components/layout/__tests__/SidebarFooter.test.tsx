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
  // STRICT: verifies expanded state shows username, reliability score, profile link, StatusSelector, premium upsell with link to /premium
  it('renders expanded state with profile info and premium upsell', () => {
    const { container } = render(
      <SidebarFooter
        isExpanded={true}
        profile={{ username: 'TestUser', avatar_url: null, reliability_score: 95 }}
        onOpenCustomStatus={vi.fn()}
      />
    )
    // Username displayed
    expect(screen.getByText('TestUser')).toBeInTheDocument()

    // Reliability score
    expect(screen.getByText('95% fiable')).toBeInTheDocument()

    // Profile link with correct aria-label
    const profileLinks = screen.getAllByLabelText('Voir mon profil')
    expect(profileLinks.length).toBeGreaterThanOrEqual(1)
    expect(profileLinks[0].closest('a')!.getAttribute('href')).toBe('/profile')

    // StatusSelector rendered when expanded
    expect(screen.getByText('StatusSelector')).toBeInTheDocument()

    // Premium upsell
    expect(screen.getByText('Passe Premium')).toBeInTheDocument()
    expect(screen.getByText('Stats avancées, IA coach, qualité audio HD')).toBeInTheDocument()
    expect(screen.getByText(/Découvrir/)).toBeInTheDocument()

    // Premium link goes to /premium
    const premiumLink = screen.getByLabelText('Passer Premium - Stats avancées, IA coach, qualité audio HD')
    expect(premiumLink.closest('a')!.getAttribute('href')).toBe('/premium')

    // Footer element wraps content
    expect(container.querySelector('footer')).toBeTruthy()

    // Fallback avatar (no avatar_url) renders User icon
    expect(screen.getAllByText('user').length).toBeGreaterThanOrEqual(1)
  })

  // STRICT: verifies collapsed state hides username/score/StatusSelector, shows only avatar icon and premium zap icon
  it('renders collapsed state with minimal UI', () => {
    const { container } = render(
      <SidebarFooter
        isExpanded={false}
        profile={{ username: 'TestUser', avatar_url: null, reliability_score: 95 }}
        onOpenCustomStatus={vi.fn()}
      />
    )
    // No username text when collapsed
    expect(screen.queryByText('TestUser')).toBeNull()
    expect(screen.queryByText('95% fiable')).toBeNull()

    // No StatusSelector when collapsed
    expect(screen.queryByText('StatusSelector')).toBeNull()

    // No expanded premium text
    expect(screen.queryByText('Passe Premium')).toBeNull()

    // Premium zap icon still visible
    const premiumLink = screen.getByLabelText('Passer Premium')
    expect(premiumLink.closest('a')!.getAttribute('href')).toBe('/premium')

    // Zap icon rendered for premium
    expect(screen.getAllByText('zap').length).toBeGreaterThanOrEqual(1)

    // Profile link still available
    expect(screen.getByLabelText('Voir mon profil')).toBeInTheDocument()
  })

  // STRICT: verifies default values when profile fields are null, and avatar image is rendered when avatar_url is provided
  it('handles null profile fields and renders avatar image', () => {
    // Null profile shows defaults
    render(
      <SidebarFooter
        isExpanded={true}
        profile={null}
        onOpenCustomStatus={vi.fn()}
      />
    )
    expect(screen.getByText('Mon profil')).toBeInTheDocument()
    expect(screen.getByText('100% fiable')).toBeInTheDocument()

    // With avatar_url, renders img element
    const { container } = render(
      <SidebarFooter
        isExpanded={true}
        profile={{ username: 'AvatarUser', avatar_url: 'https://example.com/avatar.png', reliability_score: 88 }}
        onOpenCustomStatus={vi.fn()}
      />
    )
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img!.getAttribute('src')).toBe('https://cdn.test/avatar.jpg')
    expect(img!.getAttribute('alt')).toBe('AvatarUser')
    expect(img!.getAttribute('loading')).toBe('lazy')
    expect(img!.getAttribute('decoding')).toBe('async')
    expect(screen.getByText('88% fiable')).toBeInTheDocument()
  })
})
