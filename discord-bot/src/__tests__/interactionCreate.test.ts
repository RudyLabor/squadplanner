import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase.js', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

vi.mock('../lib/permissions.js', () => ({
  checkServerPremium: vi.fn(),
  invalidatePremiumCache: vi.fn(),
}))

vi.mock('../lib/embeds.js', () => ({
  premiumRequiredEmbed: vi.fn().mockReturnValue({ data: { title: 'Premium Required' } }),
}))

import { interactionCreate } from '../events/interactionCreate.js'
import { checkServerPremium } from '../lib/permissions.js'
import { premiumRequiredEmbed } from '../lib/embeds.js'

function createMockInteraction(overrides: Record<string, unknown> = {}) {
  const execute = vi.fn()
  return {
    interaction: {
      isChatInputCommand: vi.fn().mockReturnValue(true),
      commandName: 'session',
      guildId: 'guild-1',
      replied: false,
      deferred: false,
      reply: vi.fn(),
      followUp: vi.fn(),
      client: {
        commands: new Map([
          ['session', { execute, premium: false }],
          ['analytics', { execute: vi.fn(), premium: true }],
        ]),
      },
      ...overrides,
    },
    execute,
  }
}

describe('interactionCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ignores non-chat-input interactions', async () => {
    const { interaction } = createMockInteraction()
    interaction.isChatInputCommand.mockReturnValue(false)

    await interactionCreate(interaction as never)

    expect(interaction.reply).not.toHaveBeenCalled()
  })

  it('ignores unknown commands', async () => {
    const { interaction } = createMockInteraction({ commandName: 'unknown' })

    await interactionCreate(interaction as never)

    expect(interaction.reply).not.toHaveBeenCalled()
  })

  it('executes a free command without premium check', async () => {
    const { interaction, execute } = createMockInteraction()

    await interactionCreate(interaction as never)

    expect(checkServerPremium).not.toHaveBeenCalled()
    expect(execute).toHaveBeenCalledWith(interaction)
  })

  it('blocks premium command when server is not premium', async () => {
    const premiumExecute = vi.fn()
    const { interaction } = createMockInteraction({
      commandName: 'analytics',
    })
    interaction.client.commands.set('analytics', { execute: premiumExecute, premium: true } as never)
    vi.mocked(checkServerPremium).mockResolvedValue(false)

    await interactionCreate(interaction as never)

    expect(checkServerPremium).toHaveBeenCalledWith('guild-1')
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ ephemeral: true }),
    )
    expect(premiumExecute).not.toHaveBeenCalled()
  })

  it('allows premium command when server is premium', async () => {
    const premiumExecute = vi.fn()
    const { interaction } = createMockInteraction({
      commandName: 'analytics',
    })
    interaction.client.commands.set('analytics', { execute: premiumExecute, premium: true } as never)
    vi.mocked(checkServerPremium).mockResolvedValue(true)

    await interactionCreate(interaction as never)

    expect(premiumExecute).toHaveBeenCalledWith(interaction)
  })

  it('handles command execution error with reply', async () => {
    const { interaction, execute } = createMockInteraction()
    execute.mockRejectedValue(new Error('Command failed'))

    await interactionCreate(interaction as never)

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('erreur'),
        ephemeral: true,
      }),
    )
  })

  it('uses followUp when already replied', async () => {
    const { interaction, execute } = createMockInteraction({ replied: true })
    execute.mockRejectedValue(new Error('Command failed'))

    await interactionCreate(interaction as never)

    expect(interaction.followUp).toHaveBeenCalledWith(
      expect.objectContaining({ ephemeral: true }),
    )
    expect(interaction.reply).not.toHaveBeenCalled()
  })

  it('uses followUp when deferred', async () => {
    const { interaction, execute } = createMockInteraction({ deferred: true })
    execute.mockRejectedValue(new Error('Command failed'))

    await interactionCreate(interaction as never)

    expect(interaction.followUp).toHaveBeenCalled()
  })
})
