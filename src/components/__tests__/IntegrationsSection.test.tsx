import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ data: [], error: null }) }),
      update: vi
        .fn()
        .mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  supabase: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ data: [], error: null }) }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  isSupabaseReady: vi.fn().mockReturnValue(true),
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

vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
}))

vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), {
    getState: vi.fn().mockReturnValue({ locale: 'fr' }),
  }),
}))

import { IntegrationsSection } from '../IntegrationsSection'

describe('IntegrationsSection', () => {
  it('renders integrations heading', () => {
    render(<IntegrationsSection />)
    expect(screen.getByText('Integrations')).toBeInTheDocument()
  })

  it('renders Google Calendar integration', () => {
    render(<IntegrationsSection />)
    expect(screen.getByText('Google Calendar')).toBeInTheDocument()
  })

  it('renders Twitch integration', () => {
    render(<IntegrationsSection />)
    expect(screen.getByText('Twitch')).toBeInTheDocument()
  })

  it('renders Discord integration', () => {
    render(<IntegrationsSection />)
    expect(screen.getByText('Discord')).toBeInTheDocument()
  })

  it('renders Steam/Xbox/PlayStation coming soon', () => {
    render(<IntegrationsSection />)
    expect(screen.getByText('Steam / Xbox / PlayStation')).toBeInTheDocument()
    expect(screen.getByText('Bientot')).toBeInTheDocument()
  })

  it('renders Twitch username input', () => {
    render(<IntegrationsSection />)
    expect(screen.getByPlaceholderText('Pseudo Twitch')).toBeInTheDocument()
  })

  it('renders Discord username input', () => {
    render(<IntegrationsSection />)
    expect(screen.getByPlaceholderText('Pseudo#1234')).toBeInTheDocument()
  })
})
