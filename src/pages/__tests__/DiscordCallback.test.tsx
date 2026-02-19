import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Hoist mocks to avoid initialization ordering issues
const { mockNavigate, mockSearchParams, mockRefreshSession, mockGetSession } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSearchParams: new URLSearchParams(),
  mockRefreshSession: vi.fn(),
  mockGetSession: vi.fn(),
}))

// Mock react-router
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}))

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: {
      refreshSession: mockRefreshSession,
      getSession: mockGetSession,
    },
  },
}))

// Mock toast
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

// Mock auth store
vi.mock('../../hooks', () => ({
  useAuthStore: {
    getState: vi.fn().mockReturnValue({ profile: null }),
    setState: vi.fn(),
  },
}))

// Mock icons
vi.mock('../../components/icons', () => ({
  Loader2: ({ className }: { className: string }) => <div data-testid="loader" className={className} />,
}))

import { DiscordCallback } from '../DiscordCallback'

describe('DiscordCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset search params
    ;[...mockSearchParams.keys()].forEach((k) => mockSearchParams.delete(k))
  })

  it('renders loading state initially', () => {
    mockSearchParams.set('code', 'test-code')
    mockRefreshSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } })

    // Use a never-resolving fetch to keep loading
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))

    render(<DiscordCallback />)

    expect(screen.getByText(/Connexion de ton compte Discord/i)).toBeTruthy()
  })

  it('shows error when OAuth error param present', async () => {
    mockSearchParams.set('error', 'access_denied')

    render(<DiscordCallback />)

    expect(await screen.findByText(/Autorisation Discord refusee/i)).toBeTruthy()
  })

  it('shows error when code param missing', async () => {
    // No code, no error param
    render(<DiscordCallback />)

    expect(await screen.findByText(/Code OAuth manquant/i)).toBeTruthy()
  })

  it('shows error when not authenticated', async () => {
    mockSearchParams.set('code', 'test-code')
    mockRefreshSession.mockResolvedValue({ data: null })
    mockGetSession.mockResolvedValue({ data: { session: null } })

    render(<DiscordCallback />)

    expect(await screen.findByText(/Tu dois être connecté/i)).toBeTruthy()
  })
})
