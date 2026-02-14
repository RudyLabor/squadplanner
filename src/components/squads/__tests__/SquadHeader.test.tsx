import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { SquadHeader } from '../SquadHeader'

// Mock react-router
vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
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
  Crown: (props: any) => createElement('svg', { 'data-testid': 'icon-crown', ...props }),
  Copy: (props: any) => createElement('svg', { 'data-testid': 'icon-copy', ...props }),
  Check: (props: any) => createElement('svg', { 'data-testid': 'icon-check', ...props }),
  MessageCircle: (props: any) => createElement('svg', { 'data-testid': 'icon-message', ...props }),
  Settings: (props: any) => createElement('svg', { 'data-testid': 'icon-settings', ...props }),
  X: (props: any) => createElement('svg', { 'data-testid': 'icon-x', ...props }),
}))

// Mock UI components
vi.mock('../../ui', () => ({
  Button: ({ children, onClick, disabled, variant, size, className, ...props }: any) =>
    createElement('button', { onClick, disabled, className, ...props }, children),
}))

// Mock toast
vi.mock('../../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

// Mock InviteModal
vi.mock('../InviteModal', () => ({
  InviteModal: ({ isOpen }: any) => (isOpen ? createElement('div', { 'data-testid': 'invite-modal' }, 'InviteModal') : null),
}))

// Mock useUpdateSquadMutation
vi.mock('../../../hooks/queries', () => ({
  useUpdateSquadMutation: vi.fn().mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}))

// Mock clipboard
const mockClipboard = { writeText: vi.fn().mockResolvedValue(undefined) }
Object.defineProperty(navigator, 'clipboard', { value: mockClipboard, writable: true })

const defaultSquad = {
  id: 'squad-1',
  name: 'Test Squad',
  game: 'Valorant',
  member_count: 4,
  invite_code: 'ABC123',
  owner_id: 'user-1',
  members: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
}

describe('SquadHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<SquadHeader squadId="squad-1" squad={defaultSquad} isOwner={false} />)
    expect(screen.getByText('Test Squad')).toBeInTheDocument()
  })

  it('displays the squad name', () => {
    render(<SquadHeader squadId="squad-1" squad={defaultSquad} isOwner={false} />)
    expect(screen.getByText('Test Squad')).toBeInTheDocument()
  })

  it('displays game and member count', () => {
    render(<SquadHeader squadId="squad-1" squad={defaultSquad} isOwner={false} />)
    expect(screen.getByText(/Valorant/)).toBeInTheDocument()
    expect(screen.getByText(/4 membres/)).toBeInTheDocument()
  })

  it('displays the invite code', () => {
    render(<SquadHeader squadId="squad-1" squad={defaultSquad} isOwner={false} />)
    expect(screen.getByText('ABC123')).toBeInTheDocument()
  })

  it('shows crown icon for owner', () => {
    render(<SquadHeader squadId="squad-1" squad={defaultSquad} isOwner={true} />)
    expect(screen.getByTestId('icon-crown')).toBeInTheDocument()
  })

  it('does not show crown icon for non-owner', () => {
    render(<SquadHeader squadId="squad-1" squad={defaultSquad} isOwner={false} />)
    expect(screen.queryByTestId('icon-crown')).not.toBeInTheDocument()
  })

  it('shows settings button for owner', () => {
    render(<SquadHeader squadId="squad-1" squad={defaultSquad} isOwner={true} />)
    expect(screen.getByLabelText('Modifier la squad')).toBeInTheDocument()
  })

  it('does not show settings button for non-owner', () => {
    render(<SquadHeader squadId="squad-1" squad={defaultSquad} isOwner={false} />)
    expect(screen.queryByLabelText('Modifier la squad')).not.toBeInTheDocument()
  })

  it('has a link to messages', () => {
    render(<SquadHeader squadId="squad-1" squad={defaultSquad} isOwner={false} />)
    const link = screen.getByLabelText('Ouvrir les messages de cette squad')
    expect(link).toHaveAttribute('href', '/messages?squad=squad-1')
  })

  it('has a copy invite code button', () => {
    render(<SquadHeader squadId="squad-1" squad={defaultSquad} isOwner={false} />)
    expect(screen.getByLabelText("Copier le code d'invitation")).toBeInTheDocument()
  })

  it('copies invite code to clipboard when copy button is clicked', () => {
    render(<SquadHeader squadId="squad-1" squad={defaultSquad} isOwner={false} />)
    fireEvent.click(screen.getByLabelText("Copier le code d'invitation"))
    expect(mockClipboard.writeText).toHaveBeenCalledWith('ABC123')
  })
})
