import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
}))

import { ClientRouteWrapper } from '../ClientRouteWrapper'

describe('ClientRouteWrapper', () => {
  // STRICT: Verifies children rendering, no query cache pollution when no seeds provided, wrapper is transparent
  it('renders children without seeds and does not modify query cache', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ClientRouteWrapper>
          <div data-testid="child">Hello World</div>
        </ClientRouteWrapper>
      </QueryClientProvider>
    )

    // 1. Children are rendered
    expect(screen.getByText('Hello World')).toBeInTheDocument()
    // 2. data-testid is accessible
    expect(screen.getByTestId('child')).toBeInTheDocument()
    // 3. No query data was set in the cache
    expect(queryClient.getQueryData(['anything'])).toBeUndefined()
    // 4. Query cache is completely empty
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    // 5. Container is not null
    expect(container).toBeTruthy()
    // 6. Child element is a div
    expect(screen.getByTestId('child').tagName).toBe('DIV')
  })

  // STRICT: Verifies seeds are applied to query cache, multiple seeds work, null data is skipped, idempotent seeding
  it('seeds query cache with provided data, skips null, and is idempotent', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const seeds = [
      { key: ['users'], data: [{ id: 1, name: 'Alice' }] },
      { key: ['settings'], data: { theme: 'dark' } },
      { key: ['nullKey'], data: null },
    ]

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ClientRouteWrapper seeds={seeds}>
          <div>Seeded Content</div>
        </ClientRouteWrapper>
      </QueryClientProvider>
    )

    // 1. Children are rendered
    expect(screen.getByText('Seeded Content')).toBeInTheDocument()
    // 2. 'users' key was seeded
    expect(queryClient.getQueryData(['users'])).toEqual([{ id: 1, name: 'Alice' }])
    // 3. 'settings' key was seeded
    expect(queryClient.getQueryData(['settings'])).toEqual({ theme: 'dark' })
    // 4. null data was NOT seeded (data != null check)
    expect(queryClient.getQueryData(['nullKey'])).toBeUndefined()
    // 5. Re-render does not duplicate seeding (seeded ref prevents it)
    rerender(
      <QueryClientProvider client={queryClient}>
        <ClientRouteWrapper seeds={[{ key: ['users'], data: [{ id: 2, name: 'Bob' }] }]}>
          <div>Seeded Content</div>
        </ClientRouteWrapper>
      </QueryClientProvider>
    )
    // 6. Data remains from FIRST seed (idempotent — seeded.current is true)
    expect(queryClient.getQueryData(['users'])).toEqual([{ id: 1, name: 'Alice' }])
  })
})
