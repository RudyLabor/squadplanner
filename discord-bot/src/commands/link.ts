import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { baseEmbed, successEmbed } from '../lib/embeds.js'
import type { BotCommand } from '../types.js'

const APP_URL = process.env.APP_URL || 'https://squadplanner.fr'

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true })

  // Check if user is already linked
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('username')
    .eq('discord_user_id', interaction.user.id)
    .single()

  if (existingProfile) {
    await interaction.editReply({
      embeds: [
        successEmbed(
          'Compte deja lie',
          `Ton Discord est lie au profil **${existingProfile.username}** sur Squad Planner.\n\n` +
            `Pour modifier, va dans [Parametres > Comptes connectes](${APP_URL}/settings#connected).`,
        ),
      ],
    })
    return
  }

  // Not linked — guide user to the web app OAuth flow
  await interaction.editReply({
    embeds: [
      baseEmbed()
        .setTitle('Connecte ton compte Discord')
        .setDescription(
          `Pour lier ton compte Discord a Squad Planner, utilise le bouton **Connecter Discord** dans l'app :\n\n` +
            `**[Ouvrir les Parametres](${APP_URL}/settings#connected)**\n\n` +
            `> Parametres → Comptes connectes → Connecter Discord\n\n` +
            `C'est securise : tu autorises via Discord OAuth, aucun mot de passe n'est partage.`,
        ),
    ],
  })
}

export default {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Lie ton compte Discord a ton profil SquadPlanner'),
  execute,
} satisfies BotCommand
