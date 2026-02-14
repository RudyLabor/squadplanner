import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { useAuthStore } from '../../hooks'

// Mock react-router
vi.mock('react-router', () => ({
  Navigate: ({ to }: any) => createElement('div', { 'data-testid': `navigate-${to}` }, `Navigating to ${to}`),
  Outlet: () => createElement('div', { 'data-testid': 'outlet' }, 'Outlet Content'),
}))

// Mock react-query
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn().mockReturnValue({
    setQueryData: vi.fn(),
  }),
}))

// Mock auth store
vi.mock('../../hooks', () => ({
  useAuthStore: vi.fn().mockReturnValue({
    user: { id: 'user-1' },
    isInitialized: true,
  }),
}))

// Mock query keys
vi.mock('../../lib/queryClient', () => ({
  queryKeys: {
    squads: { list: () => ['squads', 'list'] },
    profile: { current: () => ['profile', 'current'] },
  },
}))

const mockedUseAuthStore = vi.mocked(useAuthStore)

import { ProtectedLayoutClient } from '../ProtectedLayoutClient'

describe('ProtectedLayoutClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockedUseAuthStore.mockReturnValue({
      user: { id: 'user-1' },
      isInitialized: true,
    } as any)
  })

  it('renders Outlet when user has loader data and squads', () => {
    localStorage.setItem('sq-onboarding-skipped', 'true')
    render(createElement(ProtectedLayoutClient, {
      loaderData: {
        user: { id: 'user-1', email: 'test@test.com' },
        profile: { id: 'user-1', username: 'TestUser' } as any,
        squads: [{ id: 'squad-1', name: 'Test Squad' }] as any,
      },
    }))
    expect(screen.getByTestId('outlet')).toBeDefined()
  })

  it('navigates to auth when no client user and no loader data', () => {
    mockedUseAuthStore.mockReturnValue({ user: null, isInitialized: true } as any)
    render(createElement(ProtectedLayoutClient, {
      loaderData: undefined as any,
    }))
    expect(screen.getByTestId('navigate-/auth')).toBeDefined()
  })

  it('shows loading spinner when not initialized', () => {
    mockedUseAuthStore.mockReturnValue({ user: null, isInitialized: false } as any)
    const { container } = render(createElement(ProtectedLayoutClient, {
      loaderData: undefined as any,
    }))
    expect(container.querySelector('.animate-spin')).toBeDefined()
  })
})
