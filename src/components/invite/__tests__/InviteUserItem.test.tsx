import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { InviteUserItem } from '../InviteUserItem'

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
  '../../icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t, name) =>
          typeof name === 'string'
            ? (props: any) => createElement('svg', { 'data-testid': `icon-${name}`, ...props })
            : undefined,
      }
    )
)

vi.mock('../../ui', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) =>
    createElement('button', { onClick, disabled, ...props }, children),
}))

describe('InviteUserItem', () => {
  const baseMember = {
    id: 'user-1',
    username: 'TestUser',
    avatar_url: null,
    is_online: true,
  }

  it('renders member username', () => {
    render(
      <InviteUserItem member={baseMember} isInvited={false} isSending={false} onInvite={vi.fn()} />
    )
    expect(screen.getByText('TestUser')).toBeDefined()
  })

  it('shows online status', () => {
    render(
      <InviteUserItem member={baseMember} isInvited={false} isSending={false} onInvite={vi.fn()} />
    )
    expect(screen.getByText('En ligne')).toBeDefined()
  })

  it('shows offline status', () => {
    const offlineMember = { ...baseMember, is_online: false }
    render(
      <InviteUserItem
        member={offlineMember}
        isInvited={false}
        isSending={false}
        onInvite={vi.fn()}
      />
    )
    expect(screen.getByText('Hors ligne')).toBeDefined()
  })

  it('shows "Inviter" button when not invited', () => {
    render(
      <InviteUserItem member={baseMember} isInvited={false} isSending={false} onInvite={vi.fn()} />
    )
    expect(screen.getByText('Inviter')).toBeDefined()
  })

  it('shows "Invite" text when already invited', () => {
    render(
      <InviteUserItem member={baseMember} isInvited={true} isSending={false} onInvite={vi.fn()} />
    )
    expect(screen.getByText('Invite')).toBeDefined()
  })

  it('renders first letter avatar when no avatar_url', () => {
    render(
      <InviteUserItem member={baseMember} isInvited={false} isSending={false} onInvite={vi.fn()} />
    )
    expect(screen.getByText('T')).toBeDefined()
  })

  it('renders avatar image when avatar_url is provided', () => {
    const memberWithAvatar = { ...baseMember, avatar_url: 'https://example.com/avatar.jpg' }
    render(
      <InviteUserItem
        member={memberWithAvatar}
        isInvited={false}
        isSending={false}
        onInvite={vi.fn()}
      />
    )
    const img = screen.getByAlt('TestUser')
    expect(img).toBeDefined()
  })
})
