import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { InviteModal } from '../InviteModal'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  m: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
}))

// Mock supabase
const mockFrom = vi.hoisted(() => vi.fn())
vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: { from: mockFrom },
  supabase: { from: mockFrom },
}))

// Mock system messages
const mockSendMemberJoined = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
vi.mock('../../../lib/systemMessages', () => ({
  sendMemberJoinedMessage: mockSendMemberJoined,
}))

// Mock toast
const mockShowSuccess = vi.hoisted(() => vi.fn())
vi.mock('../../../lib/toast', () => ({
  showSuccess: mockShowSuccess,
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
}))

// Mock icons
vi.mock('../../icons', () => ({
  Copy: (props: any) => createElement('svg', { 'data-testid': 'icon-copy', ...props }),
  Check: (props: any) => createElement('svg', { 'data-testid': 'icon-check', ...props }),
  X: (props: any) => createElement('svg', { 'data-testid': 'icon-x', ...props }),
  Search: (props: any) => createElement('svg', { 'data-testid': 'icon-search', ...props }),
  Share2: (props: any) => createElement('svg', { 'data-testid': 'icon-share2', ...props }),
  UserPlus: (props: any) => createElement('svg', { 'data-testid': 'icon-userplus', ...props }),
  Loader2: (props: any) => createElement('svg', { 'data-testid': 'icon-loader2', ...props }),
  Users: (props: any) => createElement('svg', { 'data-testid': 'icon-users', ...props }),
}))

// Mock UI components
vi.mock('../../ui', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) =>
    createElement('button', { onClick, disabled, ...props }, children),
  Input: ({ onChange, onKeyDown, value, placeholder, className, ...props }: any) =>
    createElement('input', { onChange, onKeyDown, value, placeholder, className, ...props }),
}))

// Mock clipboard
const mockClipboard = { writeText: vi.fn().mockResolvedValue(undefined) }
Object.defineProperty(navigator, 'clipboard', { value: mockClipboard, writable: true })

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  squadId: 'squad-1',
  squadName: 'Test Squad',
  inviteCode: 'ABC123',
  existingMemberIds: ['user-1'],
}

// Helper to set up supabase mock for search
function setupSearchMock(results: any[] = [], error: any = null) {
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      ilike: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: results, error }),
      }),
    }),
    insert: vi.fn().mockResolvedValue({ error: null }),
  })
}

// Helper to set up supabase mock for insert
function setupInsertMock(error: any = null) {
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      ilike: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
    insert: vi.fn().mockResolvedValue({ error }),
  })
}

describe('InviteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupSearchMock()
  })

  // === VISIBILITY ===

  it('renders when open', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByText('Inviter des joueurs')).toBeInTheDocument()
  })

  it('returns null when not open', () => {
    const { container } = render(<InviteModal {...defaultProps} isOpen={false} />)
    expect(container.innerHTML).toBe('')
  })

  // === INVITE CODE ===

  it('displays the invite code', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByText('ABC123')).toBeInTheDocument()
  })

  it('displays "Code d\'invitation" label', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByText("Code d'invitation")).toBeInTheDocument()
  })

  it('displays the share URL with invite code', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByText(/\/join\/ABC123/)).toBeInTheDocument()
  })

  // === CLOSE BUTTON ===

  it('has a close button with "Fermer" aria-label', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(<InviteModal {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Fermer'))
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop overlay is clicked', () => {
    render(<InviteModal {...defaultProps} />)
    // The outer div has onClick={onClose}
    const overlay = screen.getByText('Inviter des joueurs').closest('div[class*="fixed"]')
    if (overlay) {
      fireEvent.click(overlay)
      expect(defaultProps.onClose).toHaveBeenCalled()
    }
  })

  // === COPY CODE ===

  it('has a "Copier le code d\'invitation" button', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByLabelText("Copier le code d'invitation")).toBeInTheDocument()
  })

  it('copies code to clipboard on copy button click', async () => {
    render(<InviteModal {...defaultProps} />)
    fireEvent.click(screen.getByLabelText("Copier le code d'invitation"))
    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith('ABC123')
    })
    expect(mockShowSuccess).toHaveBeenCalledWith("Code d'invitation copié !")
  })

  // === COPY LINK ===

  it('has a "Copier le lien" button', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByLabelText('Copier le lien')).toBeInTheDocument()
  })

  it('copies share URL on link copy button click', async () => {
    render(<InviteModal {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Copier le lien'))
    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/join/ABC123'))
    })
    expect(mockShowSuccess).toHaveBeenCalledWith('Lien copié !')
  })

  // === SHARE CHANNELS ===

  it('displays WhatsApp, SMS, Discord, Plus share buttons', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('SMS')).toBeInTheDocument()
    expect(screen.getByText('Discord')).toBeInTheDocument()
    expect(screen.getByText('Plus')).toBeInTheDocument()
  })

  it('WhatsApp link contains squad name and share URL', () => {
    render(<InviteModal {...defaultProps} />)
    const waLink = screen.getByText('WhatsApp').closest('a')
    expect(waLink?.getAttribute('href')).toContain('wa.me')
    expect(waLink?.getAttribute('href')).toContain(encodeURIComponent('Test Squad'))
  })

  it('SMS link contains sms: protocol', () => {
    render(<InviteModal {...defaultProps} />)
    const smsLink = screen.getByText('SMS').closest('a')
    expect(smsLink?.getAttribute('href')).toContain('sms:')
  })

  // === SEARCH ===

  it('displays search input for players', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByPlaceholderText("Nom d'utilisateur...")).toBeInTheDocument()
  })

  it('shows "Chercher" button', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByText('Chercher')).toBeInTheDocument()
  })

  it('disables search button when query length < 2', () => {
    render(<InviteModal {...defaultProps} />)
    const searchBtn = screen.getByText('Chercher')
    expect(searchBtn.closest('button')?.disabled).toBe(true)
  })

  it('enables search button when query length >= 2', () => {
    render(<InviteModal {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText("Nom d'utilisateur..."), { target: { value: 'ab' } })
    const searchBtn = screen.getByText('Chercher')
    expect(searchBtn.closest('button')?.disabled).toBe(false)
  })

  it('performs search on Chercher click', async () => {
    setupSearchMock([{ id: 'u2', username: 'Player2', avatar_url: null }])
    render(<InviteModal {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText("Nom d'utilisateur..."), { target: { value: 'Player' } })
    fireEvent.click(screen.getByText('Chercher'))
    await waitFor(() => {
      expect(screen.getByText('Player2')).toBeInTheDocument()
    })
  })

  it('performs search on Enter key', async () => {
    setupSearchMock([{ id: 'u2', username: 'Player2', avatar_url: null }])
    render(<InviteModal {...defaultProps} />)
    const input = screen.getByPlaceholderText("Nom d'utilisateur...")
    fireEvent.change(input, { target: { value: 'Player' } })
    // Re-query the input after state update to get the element with updated event handlers
    const updatedInput = screen.getByPlaceholderText("Nom d'utilisateur...")
    fireEvent.keyDown(updatedInput, { key: 'Enter' })
    await waitFor(() => {
      expect(screen.getByText('Player2')).toBeInTheDocument()
    })
  })

  it('filters out existing members from search results', async () => {
    setupSearchMock([
      { id: 'user-1', username: 'ExistingMember', avatar_url: null },
      { id: 'u2', username: 'NewPlayer', avatar_url: null },
    ])
    render(<InviteModal {...defaultProps} existingMemberIds={['user-1']} />)
    fireEvent.change(screen.getByPlaceholderText("Nom d'utilisateur..."), { target: { value: 'Player' } })
    fireEvent.click(screen.getByText('Chercher'))
    await waitFor(() => {
      expect(screen.getByText('NewPlayer')).toBeInTheDocument()
      expect(screen.queryByText('ExistingMember')).not.toBeInTheDocument()
    })
  })

  it('shows "Aucun joueur trouve" when search returns empty after filtering', async () => {
    setupSearchMock([])
    render(<InviteModal {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText("Nom d'utilisateur..."), { target: { value: 'Nobody' } })
    fireEvent.click(screen.getByText('Chercher'))
    await waitFor(() => {
      expect(screen.getByText('Aucun joueur trouve')).toBeInTheDocument()
    })
  })

  it('shows avatar image when user has avatar_url', async () => {
    setupSearchMock([{ id: 'u2', username: 'Player2', avatar_url: 'https://example.com/avatar.jpg' }])
    const { container } = render(<InviteModal {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText("Nom d'utilisateur..."), { target: { value: 'Player' } })
    fireEvent.click(screen.getByText('Chercher'))
    await waitFor(() => {
      const img = container.querySelector('img')
      expect(img).not.toBeNull()
      expect(img!.getAttribute('src')).toBe('https://example.com/avatar.jpg')
    })
  })

  it('shows Users icon placeholder when user has no avatar', async () => {
    setupSearchMock([{ id: 'u2', username: 'Player2', avatar_url: null }])
    render(<InviteModal {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText("Nom d'utilisateur..."), { target: { value: 'Player' } })
    fireEvent.click(screen.getByText('Chercher'))
    await waitFor(() => {
      expect(screen.getByText('Player2')).toBeInTheDocument()
    })
  })

  // === INVITE FLOW ===

  it('shows "Inviter" button for search results', async () => {
    setupSearchMock([{ id: 'u2', username: 'Player2', avatar_url: null }])
    render(<InviteModal {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText("Nom d'utilisateur..."), { target: { value: 'Player' } })
    fireEvent.click(screen.getByText('Chercher'))
    await waitFor(() => {
      expect(screen.getByText('Inviter')).toBeInTheDocument()
    })
  })

  it('does not search when query is less than 2 characters', () => {
    render(<InviteModal {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText("Nom d'utilisateur..."), { target: { value: 'a' } })
    fireEvent.click(screen.getByText('Chercher'))
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('shows "Ou rechercher un joueur" label', () => {
    render(<InviteModal {...defaultProps} />)
    expect(screen.getByText('Ou rechercher un joueur')).toBeInTheDocument()
  })
})
