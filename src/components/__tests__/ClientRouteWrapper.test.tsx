import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
}))

import { ClientRouteWrapper } from '../ClientRouteWrapper'

describe('ClientRouteWrapper', () => {
  it('renders children without crash', () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <ClientRouteWrapper>
          <div>Hello</div>
        </ClientRouteWrapper>
      </QueryClientProvider>
    )
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('seeds query data when seeds are provided', () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <ClientRouteWrapper seeds={[{ key: ['test-key'], data: { id: 1 } }]}>
          <div>Seeded</div>
        </ClientRouteWrapper>
      </QueryClientProvider>
    )
    expect(queryClient.getQueryData(['test-key'])).toEqual({ id: 1 })
  })
})
