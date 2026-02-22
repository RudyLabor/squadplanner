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

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }),
    }),
  },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn().mockReturnValue({ current: null }),
}))

vi.mock('../ui', () => ({
  Button: ({ children, onClick, ...props }: any) =>
    createElement('button', { onClick, ...props }, children),
}))

vi.mock('../invite/CopyLinkButton', () => ({
  CopyLinkButton: ({ onCopy }: any) => createElement('button', { onClick: onCopy }, 'Copy Link'),
}))

vi.mock('../invite/InviteUserList', () => ({
  InviteUserList: () => createElement('div', { 'data-testid': 'invite-user-list' }, 'User list'),
}))

vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
}))

import { InviteToPartyModal } from '../InviteToPartyModal'

describe('InviteToPartyModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    squadId: 'sq-1',
    squadName: 'TestSquad',
    partyLink: 'https://example.com/party/123',
    currentUserId: 'user-1',
    connectedUserIds: ['user-2'],
  }

  it('renders modal when open', () => {
    render(<InviteToPartyModal {...defaultProps} />)
    expect(screen.getByText('Inviter à la Party')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<InviteToPartyModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Inviter à la Party')).not.toBeInTheDocument()
  })

  it('displays squad name', () => {
    render(<InviteToPartyModal {...defaultProps} />)
    expect(screen.getByText('TestSquad')).toBeInTheDocument()
  })

  it('renders Fermer button', () => {
    render(<InviteToPartyModal {...defaultProps} />)
    expect(screen.getByText('Fermer')).toBeInTheDocument()
  })

  it('renders copy link button', () => {
    render(<InviteToPartyModal {...defaultProps} />)
    expect(screen.getByText('Copy Link')).toBeInTheDocument()
  })

  it('has dialog role', () => {
    render(<InviteToPartyModal {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('has close button with aria-label', () => {
    render(<InviteToPartyModal {...defaultProps} />)
    expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
  })
})
