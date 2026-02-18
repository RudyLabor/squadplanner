import type { Guild } from 'discord.js'
import { supabaseAdmin } from '../lib/supabase.js'

export async function guildCreate(guild: Guild) {
  console.log(
    `[Guild] Joined: ${guild.name} (${guild.id}) - ${guild.memberCount} members`,
  )

  // Upsert server record with free status
  await supabaseAdmin.from('discord_server_subscriptions').upsert(
    {
      discord_guild_id: guild.id,
      guild_name: guild.name,
      status: 'free',
    },
    { onConflict: 'discord_guild_id' },
  )
}
