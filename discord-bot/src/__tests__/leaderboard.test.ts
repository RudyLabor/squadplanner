import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase.js', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

vi.mock('../lib/embeds.js', () => ({
  baseEmbed: vi.fn().mockReturnValue({
    setTitle: vi.fn().mockReturnThis(),
    setDescription: vi.fn().mockReturnThis(),
    data: {},
  }),
  accountNotLinkedEmbed: vi.fn().mockReturnValue({ data: {} }),
  errorEmbed: vi.fn().mockReturnValue({ data: {} }),
}))

import leaderboardCommand from '../premium-commands/leaderboard.js'
import { supabaseAdmin } from '../lib/supabase.js'

function createInteraction(scope?: string) {
  return {
    user: { id: 'discord-user-1' },
    options: {
      getString: vi.fn().mockReturnValue(scope ?? null),
    },
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
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(result),
    } as never
  })
}

describe('/leaderboard command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    callCount = 0
  })

  it('has correct command name', () => {
    expect(leaderboardCommand.data.name).toBe('leaderboard')
  })

  it('shows not-linked embed for unlinked user', async () => {
    mockSupabaseSequence([{ data: null }])
    const interaction = createInteraction()

    await leaderboardCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })

  it('shows no-squad error for squad scope without squad', async () => {
    mockSupabaseSequence([{ data: { id: 'user-1' } }, { data: null }])
    const interaction = createInteraction('squad')

    await leaderboardCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })

  it('shows global leaderboard for global scope', async () => {
    mockSupabaseSequence([
      { data: { id: 'user-1' } },
      {
        data: [
          { username: 'Pro1', xp: 5000, level: 10, reliability_score: 95 },
          { username: 'Pro2', xp: 4000, level: 8, reliability_score: 90 },
        ],
      },
    ])
    const interaction = createInteraction('global')

    await leaderboardCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })
})
