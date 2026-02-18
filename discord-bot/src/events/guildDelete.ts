import type { Guild } from 'discord.js'

export async function guildDelete(guild: Guild) {
  console.log(`[Guild] Left: ${guild.name} (${guild.id})`)
  // Keep the DB record for potential return and Stripe lifecycle management
}
