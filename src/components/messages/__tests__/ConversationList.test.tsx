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

// Mock VirtualizedMessageList
vi.mock('../../VirtualizedMessageList', () => ({
  ConversationListSkeleton: ({ count, type }: any) =>
    createElement('div', { 'data-testid': 'conversation-list-skeleton', 'data-count': count, 'data-type': type }, `Loading ${count} ${type}`),
}))

// Mock EmptyState
vi.mock('../../EmptyState', () => ({
  EmptyState: ({ title, message, type, actionLabel, onAction }: any) =>
    createElement('div', { 'data-testid': 'empty-state', 'data-type': type }, [
      createElement('span', { key: 't' }, title),
      createElement('span', { key: 'm' }, message),
      actionLabel ? createElement('button', { key: 'a', onClick: onAction }, actionLabel) : null,
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

const mockSessionConv: SquadConversation = {
  id: 'session-1',
  name: 'Ranked Session',
  type: 'session',
  squad_id: 'sq-1',
  session_id: 'sess-1',
  last_message: {
    content: 'GG',
    created_at: '2026-02-14T13:00:00Z',
    sender: { username: 'Player2' },
  },
  unread_count: 0,
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

const mockDMConvWithAvatar: DMConversation = {
  other_user_id: 'user-3',
  other_user_username: 'JaneDoe',
  other_user_avatar_url: 'https://example.com/jane.jpg',
  last_message_content: null,
  last_message_at: null,
  last_message_sender_id: null,
  unread_count: 0,
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
  // === HEADER ===

  it('shows Messages header', () => {
    render(<ConversationList {...defaultProps} />)
    expect(screen.getByText('Messages')).toBeInTheDocument()
  })

  it('shows total unread count when > 0 with plural', () => {
    render(<ConversationList {...defaultProps} totalUnread={5} />)
    expect(screen.getByText('5 non lus')).toBeInTheDocument()
  })

  it('shows singular "non lu" for totalUnread=1', () => {
    render(<ConversationList {...defaultProps} totalUnread={1} />)
    expect(screen.getByText('1 non lu')).toBeInTheDocument()
  })

  it('hides total unread badge when 0', () => {
    render(<ConversationList {...defaultProps} totalUnread={0} />)
    expect(screen.queryByText(/non lu/)).not.toBeInTheDocument()
  })

  // === TABS ===

  it('renders squad and DM tabs with correct roles', () => {
    render(<ConversationList {...defaultProps} />)
    expect(screen.getByRole('tab', { name: /squads/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /priv/i })).toBeInTheDocument()
  })

  it('marks squads tab as selected when activeTab=squads', () => {
    render(<ConversationList {...defaultProps} activeTab="squads" />)
    expect(screen.getByRole('tab', { name: /squads/i }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tab', { name: /priv/i }).getAttribute('aria-selected')).toBe('false')
  })

  it('marks dms tab as selected when activeTab=dms', () => {
    render(<ConversationList {...defaultProps} activeTab="dms" />)
    expect(screen.getByRole('tab', { name: /priv/i }).getAttribute('aria-selected')).toBe('true')
  })

  it('calls onTabChange("dms") when DM tab clicked', () => {
    const onTabChange = vi.fn()
    render(<ConversationList {...defaultProps} onTabChange={onTabChange} />)
    fireEvent.click(screen.getByRole('tab', { name: /priv/i }))
    expect(onTabChange).toHaveBeenCalledWith('dms')
  })

  it('calls onTabChange("squads") when Squads tab clicked', () => {
    const onTabChange = vi.fn()
    render(<ConversationList {...defaultProps} activeTab="dms" onTabChange={onTabChange} />)
    fireEvent.click(screen.getByRole('tab', { name: /squads/i }))
    expect(onTabChange).toHaveBeenCalledWith('squads')
  })

  it('shows tab badge for squad unread', () => {
    render(<ConversationList {...defaultProps} squadUnread={5} />)
    // TabBadge renders count > 9 as "9+"
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows "9+" for tab badge when unread > 9', () => {
    render(<ConversationList {...defaultProps} squadUnread={15} />)
    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  it('does not show tab badge when unread is 0', () => {
    render(<ConversationList {...defaultProps} squadUnread={0} dmUnread={0} />)
    // No badge elements with numbers
    const tablist = screen.getByRole('tablist')
    expect(tablist.textContent).not.toMatch(/\d+/)
  })

  // === SEARCH ===

  it('shows correct placeholder for squads tab', () => {
    render(<ConversationList {...defaultProps} activeTab="squads" />)
    expect(screen.getByPlaceholderText('Rechercher une squad...')).toBeInTheDocument()
  })

  it('shows correct placeholder for dms tab', () => {
    render(<ConversationList {...defaultProps} activeTab="dms" />)
    expect(screen.getByPlaceholderText('Rechercher un contact...')).toBeInTheDocument()
  })

  it('has aria-label on search input', () => {
    render(<ConversationList {...defaultProps} />)
    expect(screen.getByLabelText('Rechercher une conversation')).toBeInTheDocument()
  })

  it('calls onSearchChange when typing', () => {
    const onSearchChange = vi.fn()
    render(<ConversationList {...defaultProps} onSearchChange={onSearchChange} />)
    fireEvent.change(screen.getByLabelText('Rechercher une conversation'), { target: { value: 'test' } })
    expect(onSearchChange).toHaveBeenCalledWith('test')
  })

  // === LOADING STATE ===

  it('shows loading skeleton when isLoading', () => {
    render(<ConversationList {...defaultProps} isLoading={true} />)
    expect(screen.getByTestId('conversation-list-skeleton')).toBeInTheDocument()
  })

  it('passes correct type to skeleton based on active tab', () => {
    render(<ConversationList {...defaultProps} isLoading={true} activeTab="dms" />)
    expect(screen.getByTestId('conversation-list-skeleton').getAttribute('data-type')).toBe('dm')
  })

  it('passes "squad" type when squads tab active', () => {
    render(<ConversationList {...defaultProps} isLoading={true} activeTab="squads" />)
    expect(screen.getByTestId('conversation-list-skeleton').getAttribute('data-type')).toBe('squad')
  })

  // === SQUAD CONVERSATIONS ===

  it('shows squad conversation name', () => {
    render(<ConversationList {...defaultProps} activeTab="squads" />)
    expect(screen.getByText('Test Squad')).toBeInTheDocument()
  })

  it('shows last message content with sender name', () => {
    render(<ConversationList {...defaultProps} activeTab="squads" />)
    expect(screen.getByText('TestUser:')).toBeInTheDocument()
    expect(screen.getByText('Hello squad')).toBeInTheDocument()
  })

  it('shows "Aucun message" for squad conv without last_message', () => {
    const convNoMsg: SquadConversation = { ...mockSquadConv, last_message: undefined }
    render(<ConversationList {...defaultProps} squadConversations={[convNoMsg]} filteredSquadConvs={[convNoMsg]} />)
    expect(screen.getByText('Aucun message')).toBeInTheDocument()
  })

  it('shows "Utilisateur:" when sender has no username', () => {
    const convNoSender: SquadConversation = {
      ...mockSquadConv,
      last_message: { content: 'test', created_at: '2026-01-01', sender: {} },
    }
    render(<ConversationList {...defaultProps} squadConversations={[convNoSender]} filteredSquadConvs={[convNoSender]} />)
    expect(screen.getByText('Utilisateur:')).toBeInTheDocument()
  })

  it('shows "Conversation" fallback when name is empty', () => {
    const convNoName: SquadConversation = { ...mockSquadConv, name: '' }
    render(<ConversationList {...defaultProps} squadConversations={[convNoName]} filteredSquadConvs={[convNoName]} />)
    expect(screen.getByText('Conversation')).toBeInTheDocument()
  })

  it('calls onSelectSquadConv when clicking a squad conv', () => {
    const onSelectSquadConv = vi.fn()
    render(<ConversationList {...defaultProps} onSelectSquadConv={onSelectSquadConv} />)
    fireEvent.click(screen.getByText('Test Squad'))
    expect(onSelectSquadConv).toHaveBeenCalledWith(mockSquadConv)
  })

  it('shows formatted time for last message', () => {
    render(<ConversationList {...defaultProps} />)
    expect(screen.getByText('12:00')).toBeInTheDocument()
  })

  // === UNREAD BADGE ===

  it('shows "9+" for unread count > 9 in conversation card', () => {
    const highUnread: SquadConversation = { ...mockSquadConv, unread_count: 15 }
    render(<ConversationList {...defaultProps} squadConversations={[highUnread]} filteredSquadConvs={[highUnread]} />)
    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  it('does not show unread badge when count is 0', () => {
    const noUnread: SquadConversation = { ...mockSquadConv, unread_count: 0 }
    render(<ConversationList {...defaultProps} squadConversations={[noUnread]} filteredSquadConvs={[noUnread]} />)
    // No badge with number
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  // === SESSION TYPE CONVERSATION ===

  it('shows gamepad icon for session type conversations', () => {
    render(<ConversationList {...defaultProps} filteredSquadConvs={[mockSessionConv]} squadConversations={[mockSessionConv]} />)
    expect(screen.getByTestId('gamepad-icon')).toBeInTheDocument()
  })

  // === DM CONVERSATIONS ===

  it('shows DM conversations in dms tab', () => {
    render(<ConversationList {...defaultProps} activeTab="dms" />)
    expect(screen.getByText('JohnDoe')).toBeInTheDocument()
    expect(screen.getByText('Hey there!')).toBeInTheDocument()
  })

  it('displays initial letter for DM avatar when no avatar URL', () => {
    render(<ConversationList {...defaultProps} activeTab="dms" />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('shows avatar image when DM user has avatar URL', () => {
    const { container } = render(<ConversationList {...defaultProps} activeTab="dms" filteredDMConvs={[mockDMConvWithAvatar]} dmConversations={[mockDMConvWithAvatar]} />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img!.getAttribute('src')).toBe('https://example.com/jane.jpg')
  })

  it('shows "Nouvelle conversation" for DM with no last message', () => {
    render(<ConversationList {...defaultProps} activeTab="dms" filteredDMConvs={[mockDMConvWithAvatar]} dmConversations={[mockDMConvWithAvatar]} />)
    expect(screen.getByText('Nouvelle conversation')).toBeInTheDocument()
  })

  it('calls onSelectDMConv when clicking a DM conv', () => {
    const onSelectDMConv = vi.fn()
    render(<ConversationList {...defaultProps} activeTab="dms" onSelectDMConv={onSelectDMConv} />)
    fireEvent.click(screen.getByText('JohnDoe'))
    expect(onSelectDMConv).toHaveBeenCalledWith(mockDMConv)
  })

  // === EMPTY STATES ===

  it('shows empty state when no squad conversations', () => {
    render(<ConversationList {...defaultProps} squadConversations={[]} filteredSquadConvs={[]} />)
    expect(screen.getByText('Pas encore de squads')).toBeInTheDocument()
    expect(screen.getByText('Rejoins une squad pour discuter avec tes potes.')).toBeInTheDocument()
  })

  it('shows "Voir mes squads" action in empty squads state', () => {
    render(<ConversationList {...defaultProps} squadConversations={[]} filteredSquadConvs={[]} />)
    expect(screen.getByText('Voir mes squads')).toBeInTheDocument()
  })

  it('shows no search results when filtered is empty but conversations exist', () => {
    render(<ConversationList {...defaultProps} squadConversations={[mockSquadConv]} filteredSquadConvs={[]} />)
    expect(screen.getByText('Aucune squad trouvée')).toBeInTheDocument()
    expect(screen.getByText("Essaie avec d'autres mots-clés")).toBeInTheDocument()
  })

  it('shows DM empty state when no DM conversations', () => {
    render(<ConversationList {...defaultProps} activeTab="dms" dmConversations={[]} filteredDMConvs={[]} />)
    expect(screen.getByText('Pas encore de messages privés')).toBeInTheDocument()
  })

  it('shows DM no search results state', () => {
    render(<ConversationList {...defaultProps} activeTab="dms" dmConversations={[mockDMConv]} filteredDMConvs={[]} />)
    expect(screen.getByText('Aucun contact trouvé')).toBeInTheDocument()
  })

  // === DESKTOP MODE ===

  it('applies active styling on desktop when activeSquadConvId matches', () => {
    const { container } = render(
      <ConversationList {...defaultProps} isDesktop={true} activeSquadConvId="squad-1" />
    )
    // The active card should have the active class
    const buttons = container.querySelectorAll('button')
    const activeButton = Array.from(buttons).find(b => b.className.includes('bg-primary'))
    expect(activeButton).toBeDefined()
  })

  it('does not apply active styling on mobile even with matching ID', () => {
    const { container } = render(
      <ConversationList {...defaultProps} isDesktop={false} activeSquadConvId="squad-1" />
    )
    const buttons = container.querySelectorAll('button')
    const activeButton = Array.from(buttons).find(b => b.className.includes('bg-primary'))
    expect(activeButton).toBeUndefined()
  })

  // === SHOW ON DESKTOP LAYOUT ===

  it('applies desktop layout classes when showOnDesktop is true', () => {
    const { container } = render(<ConversationList {...defaultProps} showOnDesktop={true} />)
    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.className).toContain('h-full')
  })
})
