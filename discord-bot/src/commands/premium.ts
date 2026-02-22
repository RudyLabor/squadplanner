import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { baseEmbed, errorEmbed, successEmbed } from '../lib/embeds.js'
import { createBotCheckoutSession } from '../lib/stripe.js'
import { checkServerPremium } from '../lib/permissions.js'
import type { BotCommand } from '../types.js'

const APP_URL = process.env.APP_URL || 'https://squadplanner.fr'

async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId || !interaction.guild) {
    await interaction.reply({
      embeds: [errorEmbed('Cette commande ne peut etre utilisee que dans un serveur.')],
      ephemeral: true,
    })
    return
  }

  // Check if user has admin permissions
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      embeds: [
        errorEmbed("Seuls les administrateurs du serveur peuvent gerer l'abonnement Premium."),
      ],
      ephemeral: true,
    })
    return
  }

  await interaction.deferReply({ ephemeral: true })

  // Check if server already has premium
  const isPremium = await checkServerPremium(interaction.guildId)

  if (isPremium) {
    const { data: sub } = await supabaseAdmin
      .from('discord_server_subscriptions')
      .select('current_period_end')
      .eq('discord_guild_id', interaction.guildId)
      .single()

    const endDate = sub?.current_period_end
      ? `<t:${Math.floor(new Date(sub.current_period_end).getTime() / 1000)}:D>`
      : 'inconnue'

    await interaction.editReply({
      embeds: [
        successEmbed(
          'Ce serveur est deja Premium !',
          `Prochain renouvellement : ${endDate}\n\n` +
            `Gere ton abonnement sur le [portail Stripe](${APP_URL}/premium).`
        ),
      ],
    })
    return
  }

  // Get linked SP profile (optional, for admin tracking)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('discord_user_id', interaction.user.id)
    .single()

  try {
    const checkoutUrl = await createBotCheckoutSession(
      interaction.guildId,
      interaction.guild.name,
      profile?.id ?? null
    )

    if (!checkoutUrl) {
      await interaction.editReply({
        embeds: [errorEmbed('Impossible de creer le lien de paiement. Reessaie plus tard.')],
      })
      return
    }

    await interaction.editReply({
      embeds: [
        baseEmbed()
          .setTitle('Activer Bot Premium')
          .setDescription(
            '**2,99 EUR/mois** — Debloque toutes les commandes premium pour ce serveur !\n\n' +
              '**Inclus :**\n' +
              '• Sessions recurrentes (`/recurring`)\n' +
              '• Analytics avancees (`/analytics`)\n' +
              '• Coach IA (`/coach`)\n' +
              '• Leaderboard (`/leaderboard`)\n' +
              '• Rappels de session (`/remind`)\n\n' +
              `**[Activer Premium](${checkoutUrl})**`
          ),
      ],
    })
  } catch (error) {
    console.error('[Premium] Checkout error:', error)
    await interaction.editReply({
      embeds: [errorEmbed('Erreur lors de la creation du paiement. Reessaie plus tard.')],
    })
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName('premium')
    .setDescription('Active Bot Premium sur ce serveur (admin uniquement)'),
  execute,
} satisfies BotCommand
