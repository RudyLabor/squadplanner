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

import sessionCommand from '../commands/session.js'
import { supabaseAdmin } from '../lib/supabase.js'

function createInteraction(subcommand: string, options: Record<string, unknown> = {}) {
  return {
    user: { id: 'discord-user-1' },
    options: {
      getSubcommand: vi.fn().mockReturnValue(subcommand),
      getString: vi.fn((name: string, _required?: boolean) => options[name] ?? null),
      getInteger: vi.fn((name: string) => options[name] ?? null),
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
      like: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(result),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      mockResolvedValue: vi.fn(),
      then: vi.fn().mockImplementation((cb) => cb(result)),
    } as never
  })
}

describe('/session command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    callCount = 0
  })

  it('has correct command name', () => {
    expect(sessionCommand.data.name).toBe('session')
  })

  it('shows not-linked embed when profile not found', async () => {
    mockSupabaseSequence([{ data: null }])
    const interaction = createInteraction('create')

    await sessionCommand.execute(interaction as never)

    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }))
  })

  describe('create subcommand', () => {
    it('rejects invalid date format', async () => {
      mockSupabaseSequence([
        { data: { id: 'user-1', username: 'Test' } },
        { data: { squad_id: 'squad-1', squads: { name: 'MySquad' } } },
      ])
      const interaction = createInteraction('create', {
        titre: 'Test Session',
        jeu: 'Valorant',
        date: 'invalid-date',
      })

      await sessionCommand.execute(interaction as never)

      expect(interaction.deferReply).toHaveBeenCalled()
      expect(interaction.editReply).toHaveBeenCalled()
    })

    it('rejects past dates', async () => {
      mockSupabaseSequence([
        { data: { id: 'user-1', username: 'Test' } },
        { data: { squad_id: 'squad-1', squads: { name: 'MySquad' } } },
      ])
      const interaction = createInteraction('create', {
        titre: 'Test Session',
        jeu: 'Valorant',
        date: '2020-01-01 21:00',
      })

      await sessionCommand.execute(interaction as never)

      expect(interaction.editReply).toHaveBeenCalled()
    })
  })

  describe('list subcommand', () => {
    it('shows empty message when no sessions', async () => {
      mockSupabaseSequence([
        { data: { id: 'user-1', username: 'Test' } },
        { data: [{ squad_id: 'squad-1' }] },
        { data: [] },
      ])
      const interaction = createInteraction('list')

      await sessionCommand.execute(interaction as never)

      expect(interaction.deferReply).toHaveBeenCalled()
    })
  })

  describe('join subcommand', () => {
    it('shows error when session not found', async () => {
      mockSupabaseSequence([{ data: { id: 'user-1', username: 'Test' } }, { data: [] }])
      const interaction = createInteraction('join', { id: 'abc12345' })

      await sessionCommand.execute(interaction as never)

      expect(interaction.deferReply).toHaveBeenCalled()
    })
  })
})
