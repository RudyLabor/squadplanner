import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase.js', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

vi.mock('../lib/embeds.js', () => ({
  baseEmbed: vi.fn().mockReturnValue({
    setTitle: vi.fn().mockReturnThis(),
    setDescription: vi.fn().mockReturnThis(),
    addFields: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    data: {},
  }),
  accountNotLinkedEmbed: vi.fn().mockReturnValue({ data: { title: 'Not Linked' } }),
  errorEmbed: vi.fn().mockReturnValue({ data: { title: 'Error' } }),
}))

import rsvpCommand from '../commands/rsvp.js'
import { supabaseAdmin } from '../lib/supabase.js'

function createInteraction(options: Record<string, string> = {}) {
  return {
    user: { id: 'discord-user-1' },
    options: {
      getString: vi.fn((name: string, _required?: boolean) => options[name] ?? null),
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
      like: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(result),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as never
  })
}

describe('/rsvp command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    callCount = 0
  })

  it('has correct command name', () => {
    expect(rsvpCommand.data.name).toBe('rsvp')
  })

  it('shows not-linked embed for unlinked user', async () => {
    mockSupabaseSequence([{ data: null }])
    const interaction = createInteraction({ session: 'abc1', reponse: 'present' })

    await rsvpCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })

  it('shows error when session not found', async () => {
    mockSupabaseSequence([{ data: { id: 'user-1', username: 'Test' } }, { data: [] }])
    const interaction = createInteraction({ session: 'notfound', reponse: 'present' })

    await rsvpCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })

  it('upserts RSVP and shows confirmation for valid session', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    mockSupabaseSequence([
      { data: { id: 'user-1', username: 'Test' } },
      { data: [{ id: 'session-1', title: 'Ranked', game: 'Valorant', scheduled_at: futureDate }] },
    ])
    const interaction = createInteraction({ session: 'session', reponse: 'present' })

    await rsvpCommand.execute(interaction as never)

    expect(interaction.deferReply).toHaveBeenCalled()
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) })
    )
  })
})
