import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { InviteUserList } from '../InviteUserList'

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

vi.mock('../../icons', () =>
  new Proxy({}, {
    get: (_t, name) =>
      typeof name === 'string'
        ? (props: any) => createElement('svg', { 'data-testid': `icon-${name}`, ...props })
        : undefined,
  })
)

vi.mock('../../ui', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) =>
    createElement('button', { onClick, disabled, ...props }, children),
}))

vi.mock('../InviteUserItem', () => ({
  InviteUserItem: ({ member }: any) =>
    createElement('div', { 'data-testid': `member-${member.id}` }, member.username),
}))

describe('InviteUserList', () => {
  const baseMembers = [
    { id: 'u1', username: 'Alice', avatar_url: null, is_online: true, voice_channel_id: null },
    { id: 'u2', username: 'Bob', avatar_url: null, is_online: false, voice_channel_id: null },
  ]

  it('renders loading state', () => {
    const { container } = render(
      <InviteUserList
        members={[]}
        loading={true}
        invitedMembers={new Set()}
        sendingInvite={null}
        onInvite={vi.fn()}
      />
    )
    expect(container.querySelector('.animate-spin')).toBeTruthy()
  })

  it('renders empty state when no members', () => {
    render(
      <InviteUserList
        members={[]}
        loading={false}
        invitedMembers={new Set()}
        sendingInvite={null}
        onInvite={vi.fn()}
      />
    )
    expect(screen.getByText(/Tous les membres sont déjà dans la party/)).toBeDefined()
  })

  it('renders member list', () => {
    render(
      <InviteUserList
        members={baseMembers}
        loading={false}
        invitedMembers={new Set()}
        sendingInvite={null}
        onInvite={vi.fn()}
      />
    )
    expect(screen.getByTestId('member-u1')).toBeDefined()
    expect(screen.getByTestId('member-u2')).toBeDefined()
  })

  it('displays member count', () => {
    render(
      <InviteUserList
        members={baseMembers}
        loading={false}
        invitedMembers={new Set()}
        sendingInvite={null}
        onInvite={vi.fn()}
      />
    )
    expect(screen.getByText(/Membres de la squad \(2\)/)).toBeDefined()
  })
})
