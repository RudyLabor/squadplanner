import type { Client } from 'discord.js'
import { ready } from './ready.js'
import { interactionCreate } from './interactionCreate.js'
import { guildCreate } from './guildCreate.js'
import { guildDelete } from './guildDelete.js'

export function loadEvents(client: Client) {
  client.once('ready', ready)
  client.on('interactionCreate', interactionCreate)
  client.on('guildCreate', guildCreate)
  client.on('guildDelete', guildDelete)
  console.log('[Events] Registered 4 event handlers')
}
