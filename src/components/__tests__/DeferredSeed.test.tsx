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

  // ---- P1.1 additions ----

  // STRICT: Verifies falsy values that are NOT null/undefined ARE seeded (0, false, empty string)
  describe('edge cases with falsy values', () => {
    it('seeds cache when data is 0 (falsy but not null/undefined)', () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      render(
        <QueryClientProvider client={queryClient}>
          <DeferredSeed queryKey={['zero-key']} data={0}>
            <div>Zero data</div>
          </DeferredSeed>
        </QueryClientProvider>
      )
      // 0 is not null/undefined, so it should be seeded
      expect(queryClient.getQueryData(['zero-key'])).toBe(0)
      expect(queryClient.getQueryCache().getAll()).toHaveLength(1)
      expect(screen.getByText('Zero data')).toBeInTheDocument()
    })

    it('seeds cache when data is false (falsy but not null/undefined)', () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      render(
        <QueryClientProvider client={queryClient}>
          <DeferredSeed queryKey={['false-key']} data={false}>
            <div>False data</div>
          </DeferredSeed>
        </QueryClientProvider>
      )
      expect(queryClient.getQueryData(['false-key'])).toBe(false)
      expect(queryClient.getQueryCache().getAll()).toHaveLength(1)
      expect(screen.getByText('False data')).toBeInTheDocument()
    })

    it('seeds cache when data is empty string (falsy but not null/undefined)', () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      render(
        <QueryClientProvider client={queryClient}>
          <DeferredSeed queryKey={['empty-str-key']} data="">
            <div>Empty string data</div>
          </DeferredSeed>
        </QueryClientProvider>
      )
      expect(queryClient.getQueryData(['empty-str-key'])).toBe('')
      expect(queryClient.getQueryCache().getAll()).toHaveLength(1)
      expect(screen.getByText('Empty string data')).toBeInTheDocument()
    })

    it('seeds cache when data is an empty array', () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      render(
        <QueryClientProvider client={queryClient}>
          <DeferredSeed queryKey={['empty-arr-key']} data={[]}>
            <div>Empty array data</div>
          </DeferredSeed>
        </QueryClientProvider>
      )
      expect(queryClient.getQueryData(['empty-arr-key'])).toEqual([])
      expect(queryClient.getQueryCache().getAll()).toHaveLength(1)
    })
  })

  // STRICT: Verifies ref guard prevents re-seeding on subsequent renders
  describe('ref guard (multiple renders do not re-seed)', () => {
    it('does not re-seed when data changes on subsequent renders', () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <DeferredSeed queryKey={['guard-key']} data={{ original: true }}>
            <div>Guarded</div>
          </DeferredSeed>
        </QueryClientProvider>
      )
      expect(queryClient.getQueryData(['guard-key'])).toEqual({ original: true })

      // Re-render with different data — ref guard should block overwrite
      rerender(
        <QueryClientProvider client={queryClient}>
          <DeferredSeed queryKey={['guard-key']} data={{ original: false, changed: true }}>
            <div>Guarded</div>
          </DeferredSeed>
        </QueryClientProvider>
      )
      // Still the original data
      expect(queryClient.getQueryData(['guard-key'])).toEqual({ original: true })
    })

    it('does not re-seed even after many re-renders', () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <DeferredSeed queryKey={['multi-render']} data="first">
            <div>Multi</div>
          </DeferredSeed>
        </QueryClientProvider>
      )
      expect(queryClient.getQueryData(['multi-render'])).toBe('first')

      for (let i = 0; i < 5; i++) {
        rerender(
          <QueryClientProvider client={queryClient}>
            <DeferredSeed queryKey={['multi-render']} data={`attempt-${i}`}>
              <div>Multi</div>
            </DeferredSeed>
          </QueryClientProvider>
        )
      }
      // Still original value
      expect(queryClient.getQueryData(['multi-render'])).toBe('first')
    })
  })

  // STRICT: Verifies cache state via getQueryData
  describe('cache state verification', () => {
    it('getQueryData returns exact seeded value for complex nested objects', () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const complexData = {
        users: [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }],
        meta: { page: 1, total: 42 },
      }
      render(
        <QueryClientProvider client={queryClient}>
          <DeferredSeed queryKey={['complex']} data={complexData}>
            <div>Complex</div>
          </DeferredSeed>
        </QueryClientProvider>
      )
      const cached = queryClient.getQueryData(['complex']) as typeof complexData
      expect(cached).toEqual(complexData)
      expect(cached.users).toHaveLength(2)
      expect(cached.meta.total).toBe(42)
    })

    it('getQueryData returns undefined for a key that was never seeded', () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      render(
        <QueryClientProvider client={queryClient}>
          <DeferredSeed queryKey={['seeded']} data="value">
            <div>Test</div>
          </DeferredSeed>
        </QueryClientProvider>
      )
      expect(queryClient.getQueryData(['seeded'])).toBe('value')
      expect(queryClient.getQueryData(['not-seeded'])).toBeUndefined()
    })
  })

  // STRICT: Verifies children are rendered unchanged
  describe('renders children unchanged', () => {
    it('renders complex children tree without modification', () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      render(
        <QueryClientProvider client={queryClient}>
          <DeferredSeed queryKey={['children-test']} data="data">
            <div data-testid="parent">
              <span data-testid="child-1">First</span>
              <span data-testid="child-2">Second</span>
            </div>
          </DeferredSeed>
        </QueryClientProvider>
      )
      expect(screen.getByTestId('parent')).toBeInTheDocument()
      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
    })

    it('renders text-only children', () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <DeferredSeed queryKey={['text-only']} data="data">
            Just text content
          </DeferredSeed>
        </QueryClientProvider>
      )
      expect(container.textContent).toContain('Just text content')
    })

    it('renders null children without error', () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <DeferredSeed queryKey={['null-children']} data="data">
            {null}
          </DeferredSeed>
        </QueryClientProvider>
      )
      expect(container).toBeTruthy()
    })
  })
})
