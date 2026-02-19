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
  errorEmbed: vi.fn().mockReturnValue({ data: { title: 'Error' } }),
  successEmbed: vi.fn().mockReturnValue({ data: { title: 'Success' } }),
}))

vi.mock('../lib/stripe.js', () => ({
  createBotCheckoutSession: vi.fn(),
}))

vi.mock('../lib/permissions.js', () => ({
  checkServerPremium: vi.fn(),
}))

import premiumCommand from '../commands/premium.js'
import { checkServerPremium } from '../lib/permissions.js'
import { createBotCheckoutSession } from '../lib/stripe.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { PermissionFlagsBits } from 'discord.js'

function createInteraction(overrides: Record<string, unknown> = {}) {
  return {
    guildId: 'guild-1',
    guild: { name: 'Test Server' },
    user: { id: 'discord-user-1' },
    memberPermissions: {
      has: vi.fn().mockReturnValue(true),
    },
    reply: vi.fn(),
    deferReply: vi.fn(),
    editReply: vi.fn(),
    ...overrides,
  }
}

describe('/premium command', () => {
  beforeEach(() => vi.clearAllMocks())

  it('has correct command name', () => {
    expect(premiumCommand.data.name).toBe('premium')
  })

  it('rejects when not in a server', async () => {
    const interaction = createInteraction({ guildId: null, guild: null })
    await premiumCommand.execute(interaction as never)

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ ephemeral: true }),
    )
  })

  it('rejects when user is not admin', async () => {
    const interaction = createInteraction({
      memberPermissions: { has: vi.fn().mockReturnValue(false) },
    })
    await premiumCommand.execute(interaction as never)

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ ephemeral: true }),
    )
  })

  it('shows already-premium message when server is premium', async () => {
    vi.mocked(checkServerPremium).mockResolvedValue(true)
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { current_period_end: new Date(Date.now() + 86400000).toISOString() },
        error: null,
      }),
    }
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain as never)

    const interaction = createInteraction()
    await premiumCommand.execute(interaction as never)

    expect(interaction.deferReply).toHaveBeenCalledWith({ ephemeral: true })
    expect(interaction.editReply).toHaveBeenCalled()
  })

  it('shows checkout URL when server is not premium', async () => {
    vi.mocked(checkServerPremium).mockResolvedValue(false)
    vi.mocked(createBotCheckoutSession).mockResolvedValue('https://checkout.stripe.com/test')

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'user-1' }, error: null }),
    }
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain as never)

    const interaction = createInteraction()
    await premiumCommand.execute(interaction as never)

    expect(createBotCheckoutSession).toHaveBeenCalledWith('guild-1', 'Test Server', 'user-1')
    expect(interaction.editReply).toHaveBeenCalled()
  })

  it('shows error when checkout URL is null', async () => {
    vi.mocked(checkServerPremium).mockResolvedValue(false)
    vi.mocked(createBotCheckoutSession).mockResolvedValue(null)

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as never)

    const interaction = createInteraction()
    await premiumCommand.execute(interaction as never)

    expect(interaction.editReply).toHaveBeenCalled()
  })
})
