import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { DeferredSeed } from '../DeferredSeed'

describe('DeferredSeed', () => {
  it('renders children', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <DeferredSeed queryKey={['test']} data={null}>
          <div>Child content</div>
        </DeferredSeed>
      </QueryClientProvider>
    )
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('seeds query cache when data is provided', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <DeferredSeed queryKey={['deferred-key']} data={{ items: [1, 2, 3] }}>
          <div>Seeded children</div>
        </DeferredSeed>
      </QueryClientProvider>
    )
    expect(queryClient.getQueryData(['deferred-key'])).toEqual({ items: [1, 2, 3] })
  })

  it('does not seed cache when data is null', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <DeferredSeed queryKey={['null-key']} data={null}>
          <div>No data</div>
        </DeferredSeed>
      </QueryClientProvider>
    )
    expect(queryClient.getQueryData(['null-key'])).toBeUndefined()
  })

  it('does not seed cache when data is undefined', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <DeferredSeed queryKey={['undef-key']} data={undefined}>
          <div>Undefined data</div>
        </DeferredSeed>
      </QueryClientProvider>
    )
    expect(queryClient.getQueryData(['undef-key'])).toBeUndefined()
  })
})
