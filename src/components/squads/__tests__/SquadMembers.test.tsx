import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { SquadMembers } from '../SquadMembers'

// Mock react-router
vi.mock('react-router', () => ({
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
}))

// Mock framer-motion
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

// Mock icons
vi.mock('../../icons', () => ({
  Users: (props: any) => createElement('svg', { 'data-testid': 'icon-users', ...props }),
  MessageCircle: (props: any) => createElement('svg', { 'data-testid': 'icon-message', ...props }),
  Phone: (props: any) => createElement('svg', { 'data-testid': 'icon-phone', ...props }),
  Crown: (props: any) => createElement('svg', { 'data-testid': 'icon-crown', ...props }),
  TrendingUp: (props: any) => createElement('svg', { 'data-testid': 'icon-trending', ...props }),
  UserPlus: (props: any) => createElement('svg', { 'data-testid': 'icon-userplus', ...props }),
}))

// Mock UI components
vi.mock('../../ui', () => ({
  Button: ({ children, onClick, size, variant, ...props }: any) =>
    createElement('button', { onClick, ...props }, children),
  Card: ({ children, className }: any) =>
    createElement('div', { className, 'data-testid': 'card' }, children),
  CardContent: ({ children, className }: any) =>
    createElement('div', { className, 'data-testid': 'card-content' }, children),
}))

const mockMembers = [
  {
    user_id: 'user-1',
    role: 'leader',
    profiles: { username: 'Player1', avatar_url: 'https://example.com/avatar1.png', reliability_score: 95 },
  },
  {
    user_id: 'user-2',
    role: 'member',
    profiles: { username: 'Player2', avatar_url: null, reliability_score: 70 },
  },
  {
    user_id: 'user-3',
    role: 'member',
    profiles: { username: 'Player3', avatar_url: null, reliability_score: 45 },
  },
]

const onInviteClick = vi.fn()

describe('SquadMembers', () => {
  it('renders without crashing', () => {
    render(
      <SquadMembers
        members={mockMembers}
        ownerId="user-1"
        memberCount={3}
        currentUserId="user-1"
        onInviteClick={onInviteClick}
      />
    )
    expect(screen.getByText('Membres (3)')).toBeInTheDocument()
  })

  it('displays all member names', () => {
    render(
      <SquadMembers
        members={mockMembers}
        ownerId="user-1"
        memberCount={3}
        currentUserId="user-1"
        onInviteClick={onInviteClick}
      />
    )
    expect(screen.getByText('Player1')).toBeInTheDocument()
    expect(screen.getByText('Player2')).toBeInTheDocument()
    expect(screen.getByText('Player3')).toBeInTheDocument()
  })

  it('shows crown icon for leader/owner', () => {
    render(
      <SquadMembers
        members={mockMembers}
        ownerId="user-1"
        memberCount={3}
        currentUserId="user-2"
        onInviteClick={onInviteClick}
      />
    )
    expect(screen.getAllByTestId('icon-crown').length).toBeGreaterThan(0)
  })

  it('shows reliability score for each member', () => {
    render(
      <SquadMembers
        members={mockMembers}
        ownerId="user-1"
        memberCount={3}
        currentUserId="user-1"
        onInviteClick={onInviteClick}
      />
    )
    expect(screen.getByText('95%')).toBeInTheDocument()
    expect(screen.getByText('70%')).toBeInTheDocument()
    expect(screen.getByText('45%')).toBeInTheDocument()
  })

  it('shows invite button', () => {
    render(
      <SquadMembers
        members={mockMembers}
        ownerId="user-1"
        memberCount={3}
        currentUserId="user-1"
        onInviteClick={onInviteClick}
      />
    )
    expect(screen.getByText('Inviter')).toBeInTheDocument()
  })

  it('calls onInviteClick when invite button is clicked', () => {
    render(
      <SquadMembers
        members={mockMembers}
        ownerId="user-1"
        memberCount={3}
        currentUserId="user-1"
        onInviteClick={onInviteClick}
      />
    )
    fireEvent.click(screen.getByText('Inviter'))
    expect(onInviteClick).toHaveBeenCalled()
  })

  it('does not show action buttons for current user', () => {
    render(
      <SquadMembers
        members={mockMembers}
        ownerId="user-1"
        memberCount={3}
        currentUserId="user-1"
        onInviteClick={onInviteClick}
      />
    )
    // No message/call buttons for the current user (user-1)
    expect(screen.queryByLabelText('Envoyer un message a Player1')).not.toBeInTheDocument()
  })

  it('shows action buttons for other users', () => {
    render(
      <SquadMembers
        members={mockMembers}
        ownerId="user-1"
        memberCount={3}
        currentUserId="user-1"
        onInviteClick={onInviteClick}
      />
    )
    // Action buttons for other members
    expect(screen.getByLabelText('Envoyer un message a Player2')).toBeInTheDocument()
    expect(screen.getByLabelText('Appeler Player2')).toBeInTheDocument()
  })

  it('renders avatar image when available', () => {
    render(
      <SquadMembers
        members={mockMembers}
        ownerId="user-1"
        memberCount={3}
        currentUserId="user-1"
        onInviteClick={onInviteClick}
      />
    )
    const avatar = screen.getByAltText('Player1')
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar1.png')
  })

  it('renders fallback icon when no avatar', () => {
    render(
      <SquadMembers
        members={[{ user_id: 'user-99', role: 'member', profiles: { username: 'NoAvatar', avatar_url: undefined, reliability_score: 80 } }]}
        ownerId="user-1"
        memberCount={1}
        currentUserId="user-1"
        onInviteClick={onInviteClick}
      />
    )
    expect(screen.getAllByTestId('icon-users').length).toBeGreaterThan(0)
  })
})
