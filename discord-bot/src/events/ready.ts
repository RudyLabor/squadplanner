import { ActivityType, type Client } from 'discord.js'

export function ready(client: Client<true>) {
  console.log(
    `[Ready] ${client.user.tag} online in ${client.guilds.cache.size} servers`,
  )
  client.user.setActivity('/help | squadplanner.fr', {
    type: ActivityType.Playing,
  })
}
