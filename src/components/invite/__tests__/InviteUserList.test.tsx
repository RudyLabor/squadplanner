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
  InviteUserItem: ({ member, isInvited, isSending }: any) =>
    createElement('div', { 'data-testid': `member-${member.id}` },
      createElement('span', { 'data-testid': `name-${member.id}` }, member.username),
      isInvited && createElement('span', { 'data-testid': `invited-${member.id}` }, 'invited'),
      isSending && createElement('span', { 'data-testid': `sending-${member.id}` }, 'sending'),
    ),
}))

describe('InviteUserList', () => {
  const baseMembers = [
    { id: 'u1', username: 'Alice', avatar_url: null, is_online: true, voice_channel_id: null },
    { id: 'u2', username: 'Bob', avatar_url: null, is_online: false, voice_channel_id: null },
  ]

  // STRICT: verifies loading state shows spinner icon with spin animation, no member content or empty text
  it('renders loading state with spinner', () => {
    const { container } = render(
      <InviteUserList
        members={[]}
        loading={true}
        invitedMembers={new Set()}
        sendingInvite={null}
        onInvite={vi.fn()}
      />
    )
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()
    expect(container.querySelector('[data-testid="icon-Loader2"]')).toBeTruthy()
    expect(screen.queryByText(/Tous les membres/)).toBeNull()
    expect(screen.queryByText(/Membres de la squad/)).toBeNull()
    expect(container.querySelectorAll('[data-testid^="member-"]').length).toBe(0)
    const wrapper = spinner!.closest('div')
    expect(wrapper?.classList.contains('flex')).toBe(true)
    expect(wrapper?.classList.contains('justify-center')).toBe(true)
  })

  // STRICT: verifies empty state shows correct message, no spinner, no member items
  it('renders empty state when no members', () => {
    const { container } = render(
      <InviteUserList
        members={[]}
        loading={false}
        invitedMembers={new Set()}
        sendingInvite={null}
        onInvite={vi.fn()}
      />
    )
    expect(screen.getByText(/Tous les membres sont déjà dans la party/)).toBeDefined()
    expect(container.querySelector('.animate-spin')).toBeNull()
    expect(container.querySelectorAll('[data-testid^="member-"]').length).toBe(0)
    expect(screen.queryByText(/Membres de la squad/)).toBeNull()
    const textEl = screen.getByText(/Tous les membres sont déjà dans la party/)
    expect(textEl.closest('div')?.classList.contains('text-center')).toBe(true)
  })

  // STRICT: verifies member list renders correct count label, all member items via InviteUserItem mock, and passes isInvited/isSending props
  it('renders member list with count and items', () => {
    const { container } = render(
      <InviteUserList
        members={baseMembers}
        loading={false}
        invitedMembers={new Set(['u1'])}
        sendingInvite="u2"
        onInvite={vi.fn()}
      />
    )
    // Count label
    expect(screen.getByText(/Membres de la squad \(2\)/)).toBeDefined()

    // Both members rendered
    expect(screen.getByTestId('member-u1')).toBeDefined()
    expect(screen.getByTestId('member-u2')).toBeDefined()

    // Names passed correctly
    expect(screen.getByTestId('name-u1').textContent).toBe('Alice')
    expect(screen.getByTestId('name-u2').textContent).toBe('Bob')

    // isInvited passed for u1
    expect(screen.getByTestId('invited-u1')).toBeDefined()
    expect(container.querySelector('[data-testid="invited-u2"]')).toBeNull()

    // isSending passed for u2
    expect(screen.getByTestId('sending-u2')).toBeDefined()
    expect(container.querySelector('[data-testid="sending-u1"]')).toBeNull()
  })

  // STRICT: verifies member count updates dynamically and label styling
  it('displays correct member count with proper styling', () => {
    const threeMembers = [
      ...baseMembers,
      { id: 'u3', username: 'Carol', avatar_url: null, is_online: true, voice_channel_id: null },
    ]
    render(
      <InviteUserList
        members={threeMembers}
        loading={false}
        invitedMembers={new Set()}
        sendingInvite={null}
        onInvite={vi.fn()}
      />
    )
    const label = screen.getByText(/Membres de la squad \(3\)/)
    expect(label).toBeDefined()
    expect(label.classList.contains('text-sm')).toBe(true)
    expect(label.classList.contains('uppercase')).toBe(true)
    expect(label.classList.contains('tracking-wide')).toBe(true)
    expect(label.classList.contains('font-medium')).toBe(true)

    // All 3 rendered
    expect(screen.getByTestId('member-u1')).toBeDefined()
    expect(screen.getByTestId('member-u2')).toBeDefined()
    expect(screen.getByTestId('member-u3')).toBeDefined()
  })
})
