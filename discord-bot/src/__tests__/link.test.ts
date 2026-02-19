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
  successEmbed: vi.fn().mockReturnValue({ data: { title: 'Success' } }),
}))

import linkCommand from '../commands/link.js'
import { supabaseAdmin } from '../lib/supabase.js'

function mockSupabaseQuery(data: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error: null }),
  }
  vi.mocked(supabaseAdmin.from).mockReturnValue(chain as never)
  return chain
}

function createInteraction() {
  return {
    user: { id: 'discord-user-1' },
    deferReply: vi.fn(),
    editReply: vi.fn(),
  }
}

describe('/link command', () => {
  beforeEach(() => vi.clearAllMocks())

  it('has correct command name', () => {
    expect(linkCommand.data.name).toBe('link')
  })

  it('tells user account is already linked', async () => {
    mockSupabaseQuery({ username: 'TestUser' })
    const interaction = createInteraction()

    await linkCommand.execute(interaction as never)

    expect(interaction.deferReply).toHaveBeenCalledWith({ ephemeral: true })
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) }),
    )
  })

  it('guides unlinked user to web app', async () => {
    mockSupabaseQuery(null)
    const interaction = createInteraction()

    await linkCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })
})
