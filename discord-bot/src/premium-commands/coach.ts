import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { baseEmbed, accountNotLinkedEmbed, errorEmbed } from '../lib/embeds.js'
import type { BotCommand } from '../types.js'

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply()

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, username')
    .eq('discord_user_id', interaction.user.id)
    .single()

  if (!profile) {
    await interaction.editReply({ embeds: [accountNotLinkedEmbed()] })
    return
  }

  const topic = interaction.options.getString('sujet') ?? 'general'

  try {
    // Call the existing ai-coach Edge Function
    const { data, error } = await supabaseAdmin.functions.invoke('ai-coach', {
      body: {
        user_id: profile.id,
        context_type: topic,
        source: 'discord_bot',
      },
    })

    if (error) {
      console.error('[Coach] Edge function error:', error)
      await interaction.editReply({
        embeds: [errorEmbed('Le coach IA est temporairement indisponible. Reessaie plus tard.')],
      })
      return
    }

    const advice = data?.advice || data?.message || 'Aucun conseil disponible pour le moment.'

    await interaction.editReply({
      embeds: [
        baseEmbed()
          .setTitle(`🧠 Coach IA — ${profile.username}`)
          .setDescription(advice)
          .addFields({
            name: 'Sujet',
            value: topic.charAt(0).toUpperCase() + topic.slice(1),
            inline: true,
          }),
      ],
    })
  } catch (err) {
    console.error('[Coach] Error:', err)
    await interaction.editReply({
      embeds: [errorEmbed('Erreur lors de la consultation du coach. Reessaie plus tard.')],
    })
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName('coach')
    .setDescription('Conseils IA personnalises (Premium)')
    .addStringOption((opt) =>
      opt
        .setName('sujet')
        .setDescription('Sujet du conseil')
        .addChoices(
          { name: 'General', value: 'general' },
          { name: 'Tactique', value: 'tactics' },
          { name: 'Fiabilite', value: 'reliability' },
          { name: 'Progression', value: 'progression' },
          { name: 'Composition equipe', value: 'team_composition' },
        ),
    ),
  execute,
} satisfies BotCommand
