import type { Interaction } from 'discord.js'
import { checkServerPremium } from '../lib/permissions.js'
import { premiumRequiredEmbed } from '../lib/embeds.js'
import type { BotCommand } from '../types.js'

export async function interactionCreate(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return

  const command = interaction.client.commands.get(interaction.commandName) as BotCommand | undefined
  if (!command) return

  try {
    // Premium gate: check server subscription before executing premium commands
    if (command.premium && interaction.guildId) {
      const isPremium = await checkServerPremium(interaction.guildId)
      if (!isPremium) {
        await interaction.reply({
          embeds: [premiumRequiredEmbed()],
          ephemeral: true,
        })
        return
      }
    }

    await command.execute(interaction)
  } catch (error) {
    console.error(`[Command Error] ${interaction.commandName}:`, error)
    const reply = {
      content: 'Une erreur est survenue. Reessaie plus tard.',
      ephemeral: true,
    }
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply)
    } else {
      await interaction.reply(reply)
    }
  }
}
