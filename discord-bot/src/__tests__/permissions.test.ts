import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase before importing permissions
vi.mock('../lib/supabase.js', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

import { checkServerPremium, invalidatePremiumCache } from '../lib/permissions.js'
import { supabaseAdmin } from '../lib/supabase.js'

function mockSupabaseQuery(data: unknown, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
  vi.mocked(supabaseAdmin.from).mockReturnValue(chain as never)
  return chain
}

describe('checkServerPremium', () => {
  beforeEach(() => {
    // Clear cache between tests
    invalidatePremiumCache('test-guild')
    vi.clearAllMocks()
  })

  it('returns false for non-existent server', async () => {
    mockSupabaseQuery(null)
    const result = await checkServerPremium('test-guild')
    expect(result).toBe(false)
  })

  it('returns false for free server', async () => {
    mockSupabaseQuery({ status: 'free', current_period_end: null })
    const result = await checkServerPremium('test-guild')
    expect(result).toBe(false)
  })

  it('returns true for premium server with valid period', async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    mockSupabaseQuery({ status: 'premium', current_period_end: futureDate })
    const result = await checkServerPremium('test-guild')
    expect(result).toBe(true)
  })

  it('returns false for premium server with expired period', async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    mockSupabaseQuery({ status: 'premium', current_period_end: pastDate })
    const result = await checkServerPremium('test-guild')
    expect(result).toBe(false)
  })

  it('returns true for premium server with no period end (lifetime)', async () => {
    mockSupabaseQuery({ status: 'premium', current_period_end: null })
    const result = await checkServerPremium('test-guild')
    expect(result).toBe(true)
  })

  it('returns false for cancelled server', async () => {
    mockSupabaseQuery({ status: 'cancelled', current_period_end: null })
    const result = await checkServerPremium('test-guild')
    expect(result).toBe(false)
  })

  it('caches the result and does not query DB again', async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    mockSupabaseQuery({ status: 'premium', current_period_end: futureDate })

    await checkServerPremium('test-guild')
    await checkServerPremium('test-guild')

    // Should only call DB once (second call hits cache)
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)
  })

  it('queries DB again after cache invalidation', async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    mockSupabaseQuery({ status: 'premium', current_period_end: futureDate })

    await checkServerPremium('test-guild')
    invalidatePremiumCache('test-guild')
    await checkServerPremium('test-guild')

    expect(supabaseAdmin.from).toHaveBeenCalledTimes(2)
  })
})
