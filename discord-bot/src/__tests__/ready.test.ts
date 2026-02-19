import { describe, it, expect, vi } from 'vitest'
import { ready } from '../events/ready.js'
import { ActivityType } from 'discord.js'

describe('ready', () => {
  it('sets the bot activity to Playing', () => {
    const setActivity = vi.fn()
    const client = {
      user: {
        tag: 'SquadBot#1234',
        setActivity,
      },
      guilds: { cache: { size: 5 } },
    }

    ready(client as never)

    expect(setActivity).toHaveBeenCalledWith('/help | squadplanner.fr', {
      type: ActivityType.Playing,
    })
  })

  it('logs the ready message with server count', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const client = {
      user: { tag: 'SquadBot#1234', setActivity: vi.fn() },
      guilds: { cache: { size: 10 } },
    }

    ready(client as never)

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('SquadBot#1234'),
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('10'),
    )
    consoleSpy.mockRestore()
  })
})
