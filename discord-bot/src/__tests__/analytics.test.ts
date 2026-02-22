import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase.js', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

vi.mock('../lib/embeds.js', () => ({
  baseEmbed: vi.fn().mockReturnValue({
    setTitle: vi.fn().mockReturnThis(),
    setDescription: vi.fn().mockReturnThis(),
    addFields: vi.fn().mockReturnThis(),
    data: {},
  }),
  accountNotLinkedEmbed: vi.fn().mockReturnValue({ data: {} }),
  errorEmbed: vi.fn().mockReturnValue({ data: {} }),
}))

import analyticsCommand from '../premium-commands/analytics.js'
import { supabaseAdmin } from '../lib/supabase.js'

function createInteraction() {
  return {
    user: { id: 'discord-user-1' },
    options: {},
    deferReply: vi.fn(),
    editReply: vi.fn(),
  }
}

let callCount = 0
function mockSupabaseSequence(results: Array<{ data: unknown; error?: unknown }>) {
  callCount = 0
  vi.mocked(supabaseAdmin.from).mockImplementation(() => {
    const idx = Math.min(callCount++, results.length - 1)
    const result = results[idx]
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(result),
    } as never
  })
}

describe('/analytics command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    callCount = 0
  })

  it('has correct command name', () => {
    expect(analyticsCommand.data.name).toBe('analytics')
  })

  it('shows not-linked embed for unlinked user', async () => {
    mockSupabaseSequence([{ data: null }])
    const interaction = createInteraction()

    await analyticsCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })

  it('shows no-squad error when user has no squad', async () => {
    mockSupabaseSequence([{ data: { id: 'user-1' } }, { data: null }])
    const interaction = createInteraction()

    await analyticsCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })
})
