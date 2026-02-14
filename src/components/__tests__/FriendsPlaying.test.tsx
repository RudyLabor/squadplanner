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

vi.mock('../ui', () => ({
  Card: ({ children, className }: any) => createElement('div', { className }, children),
}))

vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showInfo: vi.fn(),
}))

vi.mock('../../utils/avatarUrl', () => ({
  getOptimizedAvatarUrl: vi.fn().mockReturnValue('https://example.com/avatar.webp'),
}))

vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
}))

import { FriendsPlaying, type FriendPlaying } from '../FriendsPlaying'

const mockFriend: FriendPlaying = {
  friend_id: 'f-1',
  username: 'Alice',
  avatar_url: null,
  current_game: 'Valorant',
  last_seen_at: new Date().toISOString(),
  squad_id: 'sq-1',
  squad_name: 'TestSquad',
  party_member_count: 0,
  voice_channel_id: null,
  is_in_voice: false,
}

describe('FriendsPlaying', () => {
  it('renders empty state when no friends', () => {
    render(<FriendsPlaying friends={[]} onJoin={vi.fn()} onInvite={vi.fn()} />)
    expect(screen.getByText('Tes potes arrivent bientôt !')).toBeInTheDocument()
  })

  it('renders header when friends are present', () => {
    render(<FriendsPlaying friends={[mockFriend]} onJoin={vi.fn()} onInvite={vi.fn()} />)
    expect(screen.getByText('En train de jouer')).toBeInTheDocument()
  })

  it('renders friend count', () => {
    render(<FriendsPlaying friends={[mockFriend]} onJoin={vi.fn()} onInvite={vi.fn()} />)
    expect(screen.getByText('1 en ligne')).toBeInTheDocument()
  })

  it('renders friend username', () => {
    render(<FriendsPlaying friends={[mockFriend]} onJoin={vi.fn()} onInvite={vi.fn()} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders invite button for non-voice friends', () => {
    render(<FriendsPlaying friends={[mockFriend]} onJoin={vi.fn()} onInvite={vi.fn()} />)
    expect(screen.getByText('Inviter')).toBeInTheDocument()
  })

  it('calls onInvite when invite button clicked', () => {
    const onInvite = vi.fn()
    render(<FriendsPlaying friends={[mockFriend]} onJoin={vi.fn()} onInvite={onInvite} />)
    fireEvent.click(screen.getByText('Inviter'))
    expect(onInvite).toHaveBeenCalledWith('f-1')
  })

  it('renders join button for voice friends', () => {
    const voiceFriend = { ...mockFriend, is_in_voice: true }
    render(<FriendsPlaying friends={[voiceFriend]} onJoin={vi.fn()} onInvite={vi.fn()} />)
    expect(screen.getByText('Rejoindre')).toBeInTheDocument()
  })
})
