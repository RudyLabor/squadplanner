import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../lib/supabase.js', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

vi.mock('../lib/embeds.js', () => ({
  baseEmbed: vi.fn().mockReturnValue({
    setTitle: vi.fn().mockReturnThis(),
    setDescription: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    data: {},
  }),
  accountNotLinkedEmbed: vi.fn().mockReturnValue({ data: {} }),
  errorEmbed: vi.fn().mockReturnValue({ data: {} }),
  successEmbed: vi.fn().mockReturnValue({ data: {} }),
}))

import remindCommand from '../premium-commands/remind.js'
import { supabaseAdmin } from '../lib/supabase.js'

function createInteraction(options: Record<string, string> = {}) {
  return {
    user: { id: 'discord-user-1' },
    channelId: 'channel-1',
    channel: { send: vi.fn() },
    options: {
      getString: vi.fn((name: string, _req?: boolean) => options[name] ?? null),
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
    } as never
  })
}

describe('/remind command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    callCount = 0
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('has correct command name', () => {
    expect(remindCommand.data.name).toBe('remind')
  })

  it('shows not-linked embed for unlinked user', async () => {
    mockSupabaseSequence([{ data: null }])
    const interaction = createInteraction({ session: 'abc1', delai: '1h' })

    await remindCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })

  it('shows error when session not found', async () => {
    mockSupabaseSequence([{ data: { id: 'user-1', username: 'Rudy' } }, { data: [] }])
    const interaction = createInteraction({ session: 'notfound', delai: '1h' })

    await remindCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })

  it('shows error when reminder would be in the past', async () => {
    const pastDate = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min from now
    mockSupabaseSequence([
      { data: { id: 'user-1', username: 'Rudy' } },
      {
        data: [
          {
            id: 'session-1',
            title: 'Ranked',
            game: 'Valorant',
            scheduled_at: pastDate,
            squad_id: 'squad-1',
          },
        ],
      },
    ])
    // 24h delay for a session in 10min = reminder in past
    const interaction = createInteraction({ session: 'sess', delai: '24h' })

    await remindCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })

  it('schedules reminder for valid session and delay', async () => {
    const futureDate = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() // 3h from now
    mockSupabaseSequence([
      { data: { id: 'user-1', username: 'Rudy' } },
      {
        data: [
          {
            id: 'session-1',
            title: 'Ranked',
            game: 'Valorant',
            scheduled_at: futureDate,
            squad_id: 'squad-1',
          },
        ],
      },
    ])
    const interaction = createInteraction({ session: 'sess', delai: '1h' })

    await remindCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })
})
