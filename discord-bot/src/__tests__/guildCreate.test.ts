import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase.js', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

import { guildCreate } from '../events/guildCreate.js'
import { supabaseAdmin } from '../lib/supabase.js'

describe('guildCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('upserts the server with free status', async () => {
    const chain = {
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabaseAdmin.from).mockReturnValue(chain as never)

    const guild = { id: 'guild-1', name: 'Test Server', memberCount: 42 }
    await guildCreate(guild as never)

    expect(supabaseAdmin.from).toHaveBeenCalledWith('discord_server_subscriptions')
    expect(chain.upsert).toHaveBeenCalledWith(
      {
        discord_guild_id: 'guild-1',
        guild_name: 'Test Server',
        status: 'free',
      },
      { onConflict: 'discord_guild_id' },
    )
  })

  it('logs the join event', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as never)

    await guildCreate({ id: 'g1', name: 'My Server', memberCount: 10 } as never)

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('My Server'),
    )
    consoleSpy.mockRestore()
  })
})
