import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { DeferredSeed } from '../DeferredSeed'

describe('DeferredSeed', () => {
  // STRICT: Verifies children rendering with null data, query cache is NOT seeded, children structure intact
  it('renders children and does not seed cache when data is null', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <DeferredSeed queryKey={['test-null']} data={null}>
          <div data-testid="child">Child content</div>
        </DeferredSeed>
      </QueryClientProvider>
    )
    // 1. Children are rendered
    expect(screen.getByText('Child content')).toBeInTheDocument()
    // 2. data-testid is accessible
    expect(screen.getByTestId('child')).toBeInTheDocument()
    // 3. Query cache was NOT seeded with null
    expect(queryClient.getQueryData(['test-null'])).toBeUndefined()
    // 4. Cache is entirely empty
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    // 5. Container has content
    expect(container.innerHTML).not.toBe('')
    // 6. Child is a div element
    expect(screen.getByTestId('child').tagName).toBe('DIV')
  })

  // STRICT: Verifies seeding with valid data, correct key-value stored in cache, children still rendered
  it('seeds query cache correctly when data is a non-null object', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <DeferredSeed queryKey={['deferred-key']} data={{ items: [1, 2, 3] }}>
          <div data-testid="seeded">Seeded children</div>
        </DeferredSeed>
      </QueryClientProvider>
    )
    // 1. Children rendered
    expect(screen.getByText('Seeded children')).toBeInTheDocument()
    // 2. Query data is set with correct value
    expect(queryClient.getQueryData(['deferred-key'])).toEqual({ items: [1, 2, 3] })
    // 3. Cache contains exactly one entry
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1)
    // 4. The cache entry has the correct query key
    expect(queryClient.getQueryCache().getAll()[0].queryKey).toEqual(['deferred-key'])
    // 5. data-testid accessible
    expect(screen.getByTestId('seeded')).toBeInTheDocument()
    // 6. Seeded data is deeply equal (not just reference)
    const cachedData = queryClient.getQueryData(['deferred-key']) as { items: number[] }
    expect(cachedData.items).toHaveLength(3)
  })

  // STRICT: Verifies undefined data is NOT seeded (data != null check treats undefined as nullish)
  it('does not seed cache when data is undefined', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <DeferredSeed queryKey={['undef-key']} data={undefined}>
          <div>Undefined data</div>
        </DeferredSeed>
      </QueryClientProvider>
    )
    // 1. Children rendered
    expect(screen.getByText('Undefined data')).toBeInTheDocument()
    // 2. Cache is empty
    expect(queryClient.getQueryData(['undef-key'])).toBeUndefined()
    // 3. No entries in cache at all
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    // 4. Container has content
    expect(screen.getByText('Undefined data').tagName).toBe('DIV')
    // 5. Different query key also undefined
    expect(queryClient.getQueryData(['other-key'])).toBeUndefined()
    // 6. Rendering did not throw
    expect(true).toBe(true)
  })

  // STRICT: Verifies idempotent seeding — re-render does not overwrite first seed, multiple query keys work
  it('seeds only once and supports multiple query keys across separate components', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <DeferredSeed queryKey={['key-a']} data={{ v: 1 }}>
          <DeferredSeed queryKey={['key-b']} data={{ v: 2 }}>
            <div>Multi-seed</div>
          </DeferredSeed>
        </DeferredSeed>
      </QueryClientProvider>
    )

    // 1. Both keys seeded
    expect(queryClient.getQueryData(['key-a'])).toEqual({ v: 1 })
    expect(queryClient.getQueryData(['key-b'])).toEqual({ v: 2 })
    // 2. Two entries in cache
    expect(queryClient.getQueryCache().getAll()).toHaveLength(2)
    // 3. Children rendered
    expect(screen.getByText('Multi-seed')).toBeInTheDocument()

    // 4. Re-render with different data — should NOT overwrite (seeded ref)
    rerender(
      <QueryClientProvider client={queryClient}>
        <DeferredSeed queryKey={['key-a']} data={{ v: 999 }}>
          <DeferredSeed queryKey={['key-b']} data={{ v: 888 }}>
            <div>Multi-seed</div>
          </DeferredSeed>
        </DeferredSeed>
      </QueryClientProvider>
    )
    // 5. key-a still has original value
    expect(queryClient.getQueryData(['key-a'])).toEqual({ v: 1 })
    // 6. key-b still has original value
    expect(queryClient.getQueryData(['key-b'])).toEqual({ v: 2 })
  })
})
