import { Collection, type Client } from 'discord.js'
import type { BotCommand } from '../types.js'

// Static imports for all commands (more reliable than dynamic scanning)
import sessionCommand from './session.js'
import rsvpCommand from './rsvp.js'
import squadCommand from './squad.js'
import lfgCommand from './lfg.js'
import linkCommand from './link.js'
import helpCommand from './help.js'
import premiumCommand from './premium.js'

// Premium commands
import recurringCommand from '../premium-commands/recurring.js'
import analyticsCommand from '../premium-commands/analytics.js'
import coachCommand from '../premium-commands/coach.js'
import leaderboardCommand from '../premium-commands/leaderboard.js'
import remindCommand from '../premium-commands/remind.js'

const freeCommands: BotCommand[] = [
  sessionCommand,
  rsvpCommand,
  squadCommand,
  lfgCommand,
  linkCommand,
  helpCommand,
  premiumCommand,
]

const premiumCommands: BotCommand[] = [
  recurringCommand,
  analyticsCommand,
  coachCommand,
  leaderboardCommand,
  remindCommand,
].map((cmd) => ({ ...cmd, premium: true }))

export function loadCommands(client: Client) {
  const commands = new Collection<string, BotCommand>()

  for (const cmd of [...freeCommands, ...premiumCommands]) {
    commands.set(cmd.data.name, cmd)
  }

  client.commands = commands
  console.log(`[Commands] Loaded ${commands.size} commands (${premiumCommands.length} premium)`)
}

export function getAllCommandData() {
  return [...freeCommands, ...premiumCommands].map((cmd) => cmd.data.toJSON())
}
