import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { baseEmbed, errorEmbed, successEmbed } from '../lib/embeds.js'
import type { BotCommand } from '../types.js'

const APP_URL = process.env.APP_URL || 'https://squadplanner.fr'

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true })

  const username = interaction.options.getString('username', true).trim()

  // Check if user is already linked
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('username')
    .eq('discord_user_id', interaction.user.id)
    .single()

  if (existingProfile) {
    await interaction.editReply({
      embeds: [
        baseEmbed()
          .setTitle('Compte deja lie')
          .setDescription(
            `Ton Discord est deja lie au profil **${existingProfile.username}**.\n\n` +
              `Pour dissocier, va dans [Parametres](${APP_URL}/settings).`,
          ),
      ],
    })
    return
  }

  // Call the RPC function
  const { data: result, error } = await supabaseAdmin.rpc(
    'link_discord_account',
    {
      p_sp_username: username,
      p_discord_user_id: interaction.user.id,
      p_discord_username: interaction.user.tag,
    },
  )

  if (error) {
    await interaction.editReply({
      embeds: [errorEmbed('Erreur lors de la liaison. Reessaie plus tard.')],
    })
    return
  }

  const data = result as { success: boolean; error?: string; username?: string }

  if (!data.success) {
    await interaction.editReply({
      embeds: [errorEmbed(data.error || 'Erreur inconnue')],
    })
    return
  }

  await interaction.editReply({
    embeds: [
      successEmbed(
        'Compte lie avec succes !',
        `Ton Discord est maintenant lie a **${username}** sur Squad Planner.\n\n` +
          'Tu peux maintenant utiliser `/session`, `/rsvp`, `/squad` et les autres commandes.',
      ),
    ],
  })
}

export default {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Lie ton compte Discord a ton profil SquadPlanner')
    .addStringOption((opt) =>
      opt
        .setName('username')
        .setDescription('Ton username SquadPlanner')
        .setRequired(true),
    ),
  execute,
} satisfies BotCommand
