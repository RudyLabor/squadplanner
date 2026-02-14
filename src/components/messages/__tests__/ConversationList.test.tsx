import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { ConversationList, type SquadConversation, type DMConversation } from '../ConversationList'

// Mock icons
vi.mock('../../icons', () => ({
  Users: (props: any) => createElement('svg', { ...props, 'data-testid': 'users-icon' }),
  Gamepad2: (props: any) => createElement('svg', { ...props, 'data-testid': 'gamepad-icon' }),
  User: (props: any) => createElement('svg', { ...props, 'data-testid': 'user-icon' }),
  Search: (props: any) => createElement('svg', { ...props, 'data-testid': 'search-icon' }),
}))

// Mock VirtualizedMessageList (exports ConversationListSkeleton)
vi.mock('../../VirtualizedMessageList', () => ({
  ConversationListSkeleton: ({ count, type }: any) =>
    createElement('div', { 'data-testid': 'conversation-list-skeleton' }, `Loading ${count} ${type}`),
}))

// Mock EmptyState
vi.mock('../../EmptyState', () => ({
  EmptyState: ({ title, message }: any) =>
    createElement('div', { 'data-testid': 'empty-state' }, [
      createElement('span', { key: 't' }, title),
      createElement('span', { key: 'm' }, message),
    ]),
}))

// Mock utils
vi.mock('../utils', () => ({
  formatTime: (d: string) => d ? '12:00' : '',
}))

const mockSquadConv: SquadConversation = {
  id: 'squad-1',
  name: 'Test Squad',
  type: 'squad',
  squad_id: 'sq-1',
  last_message: {
    content: 'Hello squad',
    created_at: '2026-02-14T12:00:00Z',
    sender: { username: 'TestUser', avatar_url: null },
  },
  unread_count: 2,
}

const mockDMConv: DMConversation = {
  other_user_id: 'user-2',
  other_user_username: 'JohnDoe',
  other_user_avatar_url: null,
  last_message_content: 'Hey there!',
  last_message_at: '2026-02-14T12:00:00Z',
  last_message_sender_id: 'user-2',
  unread_count: 1,
}

const defaultProps = {
  activeTab: 'squads' as const,
  onTabChange: vi.fn(),
  searchQuery: '',
  onSearchChange: vi.fn(),
  isLoading: false,
  squadConversations: [mockSquadConv],
  dmConversations: [mockDMConv],
  filteredSquadConvs: [mockSquadConv],
  filteredDMConvs: [mockDMConv],
  isDesktop: false,
  squadUnread: 2,
  dmUnread: 1,
  totalUnread: 3,
  onSelectSquadConv: vi.fn(),
  onSelectDMConv: vi.fn(),
}

describe('ConversationList', () => {
  it('renders without crashing', () => {
    const { container } = render(<ConversationList {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('shows Messages header', () => {
    render(<ConversationList {...defaultProps} />)
    expect(screen.getByText('Messages')).toBeInTheDocument()
  })

  it('shows total unread count when > 0', () => {
    render(<ConversationList {...defaultProps} totalUnread={5} />)
    expect(screen.getByText(/5 non lus/)).toBeInTheDocument()
  })

  it('hides total unread badge when 0', () => {
    render(<ConversationList {...defaultProps} totalUnread={0} />)
    expect(screen.queryByText(/non lu/)).not.toBeInTheDocument()
  })

  it('renders squad and DM tabs', () => {
    render(<ConversationList {...defaultProps} />)
    expect(screen.getByRole('tab', { name: /squads/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /priv/i })).toBeInTheDocument()
  })

  it('calls onTabChange when DM tab is clicked', () => {
    const onTabChange = vi.fn()
    render(<ConversationList {...defaultProps} onTabChange={onTabChange} />)
    fireEvent.click(screen.getByRole('tab', { name: /priv/i }))
    expect(onTabChange).toHaveBeenCalledWith('dms')
  })

  it('shows search input with correct placeholder for squads tab', () => {
    render(<ConversationList {...defaultProps} activeTab="squads" />)
    expect(screen.getByPlaceholderText('Rechercher une squad...')).toBeInTheDocument()
  })

  it('shows search input with correct placeholder for dms tab', () => {
    render(<ConversationList {...defaultProps} activeTab="dms" />)
    expect(screen.getByPlaceholderText('Rechercher un contact...')).toBeInTheDocument()
  })

  it('calls onSearchChange when typing in search', () => {
    const onSearchChange = vi.fn()
    render(<ConversationList {...defaultProps} onSearchChange={onSearchChange} />)
    fireEvent.change(screen.getByLabelText('Rechercher une conversation'), {
      target: { value: 'test' },
    })
    expect(onSearchChange).toHaveBeenCalledWith('test')
  })

  it('shows loading skeleton when isLoading', () => {
    render(<ConversationList {...defaultProps} isLoading={true} />)
    expect(screen.getByTestId('conversation-list-skeleton')).toBeInTheDocument()
  })

  it('shows squad conversations in squads tab', () => {
    render(<ConversationList {...defaultProps} activeTab="squads" />)
    expect(screen.getByText('Test Squad')).toBeInTheDocument()
  })

  it('shows last message in squad conversation card', () => {
    render(<ConversationList {...defaultProps} activeTab="squads" />)
    expect(screen.getByText('Hello squad')).toBeInTheDocument()
  })

  it('calls onSelectSquadConv when clicking a squad conv', () => {
    const onSelectSquadConv = vi.fn()
    render(
      <ConversationList {...defaultProps} onSelectSquadConv={onSelectSquadConv} />
    )
    fireEvent.click(screen.getByText('Test Squad'))
    expect(onSelectSquadConv).toHaveBeenCalledWith(mockSquadConv)
  })

  it('shows DM conversations in dms tab', () => {
    render(<ConversationList {...defaultProps} activeTab="dms" />)
    expect(screen.getByText('JohnDoe')).toBeInTheDocument()
  })

  it('shows empty state when no squad conversations', () => {
    render(
      <ConversationList
        {...defaultProps}
        squadConversations={[]}
        filteredSquadConvs={[]}
      />
    )
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByText('Pas encore de squads')).toBeInTheDocument()
  })

  it('shows no search results state when filtered is empty but conversations exist', () => {
    render(
      <ConversationList
        {...defaultProps}
        squadConversations={[mockSquadConv]}
        filteredSquadConvs={[]}
      />
    )
    expect(screen.getByText('Aucune squad trouvée')).toBeInTheDocument()
  })

  it('shows DM empty state when no DM conversations', () => {
    render(
      <ConversationList
        {...defaultProps}
        activeTab="dms"
        dmConversations={[]}
        filteredDMConvs={[]}
      />
    )
    expect(screen.getByText('Pas encore de messages privés')).toBeInTheDocument()
  })

  it('displays initial letter for DM avatar when no avatar URL', () => {
    render(<ConversationList {...defaultProps} activeTab="dms" />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('shows "Aucun message" for squad conv without last message', () => {
    const convNoMsg: SquadConversation = {
      ...mockSquadConv,
      last_message: undefined,
    }
    render(
      <ConversationList
        {...defaultProps}
        squadConversations={[convNoMsg]}
        filteredSquadConvs={[convNoMsg]}
      />
    )
    expect(screen.getByText('Aucun message')).toBeInTheDocument()
  })
})
