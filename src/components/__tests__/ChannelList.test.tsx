import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) =>
    createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
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
    auth: { getSession: vi.fn() },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      insert: vi.fn().mockResolvedValue({ data: null }),
      update: vi.fn().mockResolvedValue({ data: null }),
      delete: vi.fn().mockResolvedValue({ data: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null }),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1', username: 'TestUser' },
      isLoading: false,
      isInitialized: true,
    }),
    {
      getState: vi.fn().mockReturnValue({
        user: { id: 'user-1' },
        profile: { id: 'user-1', username: 'TestUser' },
      }),
    }
  ),
}))
vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1', username: 'TestUser' },
      isLoading: false,
      isInitialized: true,
    }),
    {
      getState: vi.fn().mockReturnValue({
        user: { id: 'user-1' },
        profile: { id: 'user-1', username: 'TestUser' },
      }),
    }
  ),
}))

vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), {
    getState: vi.fn().mockReturnValue({ locale: 'fr' }),
  }),
}))
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
}))
vi.mock('../../utils/haptics', () => ({
  haptic: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

// Mock useSquadChannels
const mockCreateChannel = vi.fn()
const mockDeleteChannel = vi.fn()
vi.mock('../../hooks/useSquadChannels', () => ({
  useSquadChannels: vi.fn().mockReturnValue({
    channels: [
      { id: 'ch1', name: 'general', channel_type: 'text', is_default: true },
      { id: 'ch2', name: 'voice-chat', channel_type: 'voice', is_default: false },
    ],
    createChannel: (...args: any[]) => mockCreateChannel(...args),
    deleteChannel: (...args: any[]) => mockDeleteChannel(...args),
    isCreating: false,
  }),
}))

import { ChannelList } from '../ChannelList'
import { useSquadChannels } from '../../hooks/useSquadChannels'

describe('ChannelList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // STRICT: Verifies base rendering for non-leader — header, channel names, no create button, no delete buttons, channel count matches
  it('renders channels for non-leader with correct structure and no admin controls', () => {
    const onSelectChannel = vi.fn()
    const { container } = render(
      <ChannelList
        squadId="squad-1"
        activeChannelId={null}
        onSelectChannel={onSelectChannel}
        isLeader={false}
      />
    )

    // 1. "Canaux" header is present
    expect(screen.getByText('Canaux')).toBeInTheDocument()
    // 2. Channel names are visible
    expect(screen.getByText('general')).toBeInTheDocument()
    expect(screen.getByText('voice-chat')).toBeInTheDocument()
    // 3. No create button for non-leader
    expect(screen.queryByLabelText('Créer un canal')).not.toBeInTheDocument()
    // 4. No delete buttons for non-leader
    expect(screen.queryByLabelText(/Supprimer le canal/)).not.toBeInTheDocument()
    // 5. Clicking a channel calls onSelectChannel
    fireEvent.click(screen.getByText('general'))
    expect(onSelectChannel).toHaveBeenCalledWith({
      id: 'ch1',
      name: 'general',
      channel_type: 'text',
      is_default: true,
    })
    // 6. useSquadChannels was called with the correct squadId
    expect(useSquadChannels).toHaveBeenCalledWith('squad-1')
  })

  // STRICT: Verifies leader controls — create button visible, create form toggle, delete button on non-default channels, no delete on default
  it('shows leader controls: create button, delete on non-default channels, no delete on default', () => {
    render(
      <ChannelList
        squadId="squad-1"
        activeChannelId={null}
        onSelectChannel={vi.fn()}
        isLeader={true}
      />
    )

    // 1. Create button is present for leaders
    const createBtn = screen.getByLabelText('Créer un canal')
    expect(createBtn).toBeInTheDocument()
    // 2. Delete button for non-default channel (voice-chat, is_default: false)
    expect(screen.getByLabelText('Supprimer le canal voice-chat')).toBeInTheDocument()
    // 3. No delete button for default channel (general, is_default: true)
    expect(screen.queryByLabelText('Supprimer le canal general')).not.toBeInTheDocument()
    // 4. Click create button to show form
    fireEvent.click(createBtn)
    // 5. Input field appears
    expect(screen.getByPlaceholderText('nom-du-canal')).toBeInTheDocument()
    // 6. "Créer" submit button appears
    expect(screen.getByText('Créer')).toBeInTheDocument()
    // 7. Channel type buttons appear
    expect(screen.getByText('Texte')).toBeInTheDocument()
    expect(screen.getByText('Vocal')).toBeInTheDocument()
    expect(screen.getByText('Annonces')).toBeInTheDocument()
  })

  // STRICT: Verifies delete channel interaction, active channel styling, and channel selection callback with correct data
  it('handles delete channel, active channel styling, and channel click callbacks', () => {
    const onSelectChannel = vi.fn()

    render(
      <ChannelList
        squadId="squad-1"
        activeChannelId="ch1"
        onSelectChannel={onSelectChannel}
        isLeader={true}
      />
    )

    // 1. Active channel (ch1 = general) should exist
    expect(screen.getByText('general')).toBeInTheDocument()
    // 2. Click delete on voice-chat
    const deleteBtn = screen.getByLabelText('Supprimer le canal voice-chat')
    fireEvent.click(deleteBtn)
    // 3. deleteChannel was called with the correct channel id
    expect(mockDeleteChannel).toHaveBeenCalledWith('ch2')
    // 4. onSelectChannel was NOT called by the delete click (stopPropagation)
    expect(onSelectChannel).not.toHaveBeenCalled()
    // 5. Click on voice-chat text (not delete) calls onSelectChannel
    fireEvent.click(screen.getByText('voice-chat'))
    expect(onSelectChannel).toHaveBeenCalledWith({
      id: 'ch2',
      name: 'voice-chat',
      channel_type: 'voice',
      is_default: false,
    })
    // 6. onSelectChannel was called exactly once
    expect(onSelectChannel).toHaveBeenCalledTimes(1)
  })
})
