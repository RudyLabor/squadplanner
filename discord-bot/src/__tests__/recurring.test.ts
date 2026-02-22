import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase.js', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

vi.mock('../lib/embeds.js', () => ({
  baseEmbed: vi.fn().mockReturnValue({
    setTitle: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    addFields: vi.fn().mockReturnThis(),
    data: {},
  }),
  accountNotLinkedEmbed: vi.fn().mockReturnValue({ data: {} }),
  errorEmbed: vi.fn().mockReturnValue({ data: {} }),
}))

import recurringCommand from '../premium-commands/recurring.js'
import { supabaseAdmin } from '../lib/supabase.js'

function createInteraction(options: Record<string, unknown> = {}) {
  return {
    user: { id: 'discord-user-1' },
    options: {
      getString: vi.fn((name: string, _req?: boolean) => options[name] ?? null),
      getInteger: vi.fn((name: string) => options[name] ?? null),
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
      insert: vi.fn().mockResolvedValue(result),
    } as never
  })
}

describe('/recurring command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    callCount = 0
  })

  it('has correct command name', () => {
    expect(recurringCommand.data.name).toBe('recurring')
  })

  it('shows not-linked embed for unlinked user', async () => {
    mockSupabaseSequence([{ data: null }])
    const interaction = createInteraction({ jeu: 'Valorant', jour: 'mardi', heure: '21h00' })

    await recurringCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })

  it('rejects invalid day', async () => {
    mockSupabaseSequence([{ data: { id: 'user-1' } }])
    const interaction = createInteraction({ jeu: 'Valorant', jour: 'invalid', heure: '21h00' })

    await recurringCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })

  it('rejects invalid time format', async () => {
    mockSupabaseSequence([{ data: { id: 'user-1' } }])
    const interaction = createInteraction({ jeu: 'Valorant', jour: 'mardi', heure: 'noon' })

    await recurringCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })

  it('shows no-squad error when user has no squad', async () => {
    mockSupabaseSequence([{ data: { id: 'user-1' } }, { data: null }])
    const interaction = createInteraction({ jeu: 'Valorant', jour: 'mardi', heure: '21h00' })

    await recurringCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })
})
