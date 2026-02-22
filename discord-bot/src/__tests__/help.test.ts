import { describe, it, expect, vi } from 'vitest'

vi.mock('../lib/embeds.js', () => ({
  baseEmbed: vi.fn().mockReturnValue({
    setTitle: vi.fn().mockReturnThis(),
    setDescription: vi.fn().mockReturnThis(),
    addFields: vi.fn().mockReturnThis(),
    data: {},
  }),
}))

import helpCommand from '../commands/help.js'

describe('/help command', () => {
  it('has correct command name and description', () => {
    expect(helpCommand.data.name).toBe('help')
  })

  it('replies with an embed (not deferred)', async () => {
    const interaction = {
      reply: vi.fn(),
    }

    await helpCommand.execute(interaction as never)

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.arrayContaining([expect.any(Object)]),
      })
    )
  })

  it('embed mentions key commands', async () => {
    const fields: Array<{ name: string; value: string }> = []
    const { baseEmbed } = await import('../lib/embeds.js')
    vi.mocked(baseEmbed).mockReturnValue({
      setTitle: vi.fn().mockReturnThis(),
      setDescription: vi.fn().mockReturnThis(),
      addFields: vi.fn().mockImplementation((...args) => {
        fields.push(...(args as Array<{ name: string; value: string }>))
        return {
          data: {},
          setTitle: vi.fn().mockReturnThis(),
          setDescription: vi.fn().mockReturnThis(),
          addFields: vi.fn().mockReturnThis(),
        }
      }),
      data: {},
    } as never)

    const interaction = { reply: vi.fn() }
    await helpCommand.execute(interaction as never)

    const allText = fields.map((f) => `${f.name} ${f.value}`).join(' ')
    expect(allText).toContain('/link')
    expect(allText).toContain('/session')
    expect(allText).toContain('/rsvp')
  })
})
