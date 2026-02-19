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
}))

import lfgCommand from '../commands/lfg.js'
import { supabaseAdmin } from '../lib/supabase.js'

function createInteraction(options: Record<string, string | null> = {}) {
  return {
    options: {
      getString: vi.fn((name: string, _req?: boolean) => options[name] ?? null),
    },
    deferReply: vi.fn(),
    editReply: vi.fn(),
  }
}

describe('/lfg command', () => {
  beforeEach(() => vi.clearAllMocks())

  it('has correct command name', () => {
    expect(lfgCommand.data.name).toBe('lfg')
  })

  it('shows empty result when no players match', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
    }
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain as never)

    const interaction = createInteraction({ jeu: 'Valorant' })
    await lfgCommand.execute(interaction as never)

    expect(interaction.deferReply).toHaveBeenCalled()
    expect(interaction.editReply).toHaveBeenCalled()
  })

  it('filters players by game match', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          { username: 'Player1', preferred_games: ['Valorant', 'CS2'], level: 5, reliability_score: 90 },
          { username: 'Player2', preferred_games: ['League of Legends'], level: 3, reliability_score: 80 },
        ],
      }),
    }
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain as never)

    const interaction = createInteraction({ jeu: 'valorant' })
    await lfgCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })
})
