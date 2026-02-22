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

vi.mock(
  '../../../components/icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t: any, p: string) =>
          typeof p === 'string'
            ? ({ children, ...props }: any) => createElement('span', props, children)
            : undefined,
      }
    )
)

import { ParticipantAvatar } from '../ParticipantAvatar'

describe('ParticipantAvatar', () => {
  // STRICT: verifies remote user default rendering — first letter uppercase, username shown, size classes, no "Toi" label
  it('renders remote user with first letter initial, username label, and default md size', () => {
    const { container } = render(
      <ParticipantAvatar username="RemoteUser" isSpeaking={false} isMuted={false} />
    )

    // 1. First letter of username displayed (uppercase)
    expect(screen.getByText('R')).toBeDefined()
    // 2. Full username shown as label
    expect(screen.getByText('RemoteUser')).toBeDefined()
    // 3. "Toi" is NOT shown (not local)
    expect(screen.queryByText('Toi')).toBeNull()
    // 4. Default md size classes used (w-16 h-16)
    const avatarCircle = container.querySelector('.w-16')
    expect(avatarCircle).not.toBeNull()
    // 5. No mute indicator shown
    expect(container.querySelector('.bg-error')).toBeNull()
    // 6. Username label has text-text-secondary class (remote user styling)
    const label = screen.getByText('RemoteUser')
    expect(label.className).toContain('text-text-secondary')
  })

  // STRICT: verifies local user — "Toi" label, first letter, primary color styling, no full username
  it('renders local user with "Toi" label, initial, and primary color styling', () => {
    const { container } = render(
      <ParticipantAvatar username="TestUser" isSpeaking={false} isMuted={false} isLocal />
    )

    // 1. Shows "Toi" instead of username
    expect(screen.getByText('Toi')).toBeDefined()
    // 2. First letter still displayed
    expect(screen.getByText('T')).toBeDefined()
    // 3. Full username NOT shown as label
    expect(screen.queryByText('TestUser')).toBeNull()
    // 4. "Toi" label has primary color class
    const toiLabel = screen.getByText('Toi')
    expect(toiLabel.className).toContain('text-primary')
    // 5. Avatar circle has primary background
    const circle = container.querySelector('.bg-primary')
    expect(circle).not.toBeNull()
    // 6. Initial text is white (visible on primary bg)
    const initial = screen.getByText('T')
    expect(initial.className).toContain('text-white')
  })

  // STRICT: verifies muted state — mute icon indicator present, error badge, avatar still renders correctly
  it('shows mute indicator badge when isMuted is true', () => {
    const { container } = render(
      <ParticipantAvatar username="MutedUser" isSpeaking={false} isMuted={true} />
    )

    // 1. First letter rendered
    expect(screen.getByText('M')).toBeDefined()
    // 2. Username label shown
    expect(screen.getByText('MutedUser')).toBeDefined()
    // 3. Mute indicator badge (bg-error circle) present
    const muteBadge = container.querySelector('.bg-error')
    expect(muteBadge).not.toBeNull()
    // 4. MicOff icon inside badge (rendered as span by mock)
    expect(muteBadge?.querySelector('span')).not.toBeNull()
    // 5. Mute badge is positioned (absolute)
    expect(muteBadge?.className).toContain('absolute')
    // 6. Avatar size is still md default
    expect(container.querySelector('.w-16')).not.toBeNull()
  })

  // STRICT: verifies size prop affects rendered classes — sm, md, lg size variations
  it('applies correct size classes for sm, md, lg variants', () => {
    // 1. Small size
    const { container: sm, unmount: u1 } = render(
      <ParticipantAvatar username="A" isSpeaking={false} isMuted={false} size="sm" />
    )
    expect(sm.querySelector('.w-12')).not.toBeNull()
    // 2. Small text size
    const smInitial = screen.getByText('A')
    expect(smInitial.className).toContain('text-sm')
    u1()

    // 3. Medium size (default)
    const { container: md, unmount: u2 } = render(
      <ParticipantAvatar username="B" isSpeaking={false} isMuted={false} size="md" />
    )
    expect(md.querySelector('.w-16')).not.toBeNull()
    // 4. Medium text size
    const mdInitial = screen.getByText('B')
    expect(mdInitial.className).toContain('text-lg')
    u2()

    // 5. Large size
    const { container: lg } = render(
      <ParticipantAvatar username="C" isSpeaking={false} isMuted={false} size="lg" />
    )
    expect(lg.querySelector('.w-20')).not.toBeNull()
    // 6. Large text size
    const lgInitial = screen.getByText('C')
    expect(lgInitial.className).toContain('text-xl')
  })
})
