import 'dotenv/config'
import { REST, Routes } from 'discord.js'
import { getAllCommandData } from './commands/loader.js'

async function main() {
  const token = process.env.DISCORD_TOKEN
  const clientId = process.env.DISCORD_CLIENT_ID
  const guildId = process.env.DISCORD_GUILD_ID

  if (!token || !clientId) {
    console.error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID')
    process.exit(1)
  }

  const commands = getAllCommandData()
  const rest = new REST().setToken(token)

  if (guildId) {
    // Dev mode: guild-specific (instant update)
    console.log(
      `Deploying ${commands.length} commands to guild ${guildId}...`,
    )
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    })
    console.log('Guild commands deployed successfully!')
  } else {
    // Production: global commands (up to 1h propagation)
    console.log(`Deploying ${commands.length} commands globally...`)
    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    })
    console.log('Global commands deployed successfully!')
  }
}

main().catch((err) => {
  console.error('Failed to deploy commands:', err)
  process.exit(1)
})
