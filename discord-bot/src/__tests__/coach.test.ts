import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase.js', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    functions: { invoke: vi.fn() },
  },
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

import coachCommand from '../premium-commands/coach.js'
import { supabaseAdmin } from '../lib/supabase.js'

function createInteraction(sujet?: string) {
  return {
    user: { id: 'discord-user-1' },
    options: {
      getString: vi.fn().mockReturnValue(sujet ?? null),
    },
    deferReply: vi.fn(),
    editReply: vi.fn(),
  }
}

describe('/coach command', () => {
  beforeEach(() => vi.clearAllMocks())

  it('has correct command name', () => {
    expect(coachCommand.data.name).toBe('coach')
  })

  it('shows not-linked embed for unlinked user', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    }
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain as never)

    const interaction = createInteraction()
    await coachCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })

  it('calls ai-coach edge function and shows advice', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'user-1', username: 'Rudy' } }),
    }
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain as never)
    vi.mocked(supabaseAdmin.functions.invoke).mockResolvedValue({
      data: { advice: 'Play more aggressively!' },
      error: null,
    } as never)

    const interaction = createInteraction('tactics')
    await coachCommand.execute(interaction as never)

    expect(supabaseAdmin.functions.invoke).toHaveBeenCalledWith('ai-coach', {
      body: expect.objectContaining({
        user_id: 'user-1',
        context_type: 'tactics',
        source: 'discord_bot',
      }),
    })
    expect(interaction.editReply).toHaveBeenCalled()
  })

  it('shows error when edge function fails', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'user-1', username: 'Rudy' } }),
    }
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain as never)
    vi.mocked(supabaseAdmin.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'timeout' },
    } as never)

    const interaction = createInteraction()
    await coachCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })
})
