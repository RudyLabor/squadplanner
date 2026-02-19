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
  accountNotLinkedEmbed: vi.fn().mockReturnValue({ data: { title: 'Not Linked' } }),
  errorEmbed: vi.fn().mockReturnValue({ data: { title: 'Error' } }),
}))

import squadCommand from '../commands/squad.js'
import { supabaseAdmin } from '../lib/supabase.js'

function createInteraction(subcommand: string) {
  return {
    user: { id: 'discord-user-1' },
    options: {
      getSubcommand: vi.fn().mockReturnValue(subcommand),
    },
    reply: vi.fn(),
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
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(result),
    } as never
  })
}

describe('/squad command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    callCount = 0
  })

  it('has correct command name', () => {
    expect(squadCommand.data.name).toBe('squad')
  })

  it('shows not-linked embed for unlinked user', async () => {
    mockSupabaseSequence([{ data: null }])
    const interaction = createInteraction('info')

    await squadCommand.execute(interaction as never)

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ ephemeral: true }),
    )
  })

  describe('info subcommand', () => {
    it('shows error when user has no squads', async () => {
      mockSupabaseSequence([
        { data: { id: 'user-1' } },
        { data: null },
      ])
      const interaction = createInteraction('info')

      await squadCommand.execute(interaction as never)

      expect(interaction.deferReply).toHaveBeenCalled()
    })
  })

  describe('stats subcommand', () => {
    it('shows error when user has no squad', async () => {
      mockSupabaseSequence([
        { data: { id: 'user-1' } },
        { data: null },
      ])
      const interaction = createInteraction('stats')

      await squadCommand.execute(interaction as never)

      expect(interaction.deferReply).toHaveBeenCalled()
    })
  })
})
