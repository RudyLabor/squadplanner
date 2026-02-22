import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { baseEmbed, accountNotLinkedEmbed, errorEmbed } from '../lib/embeds.js'
import type { BotCommand } from '../types.js'

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply()

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('discord_user_id', interaction.user.id)
    .single()

  if (!profile) {
    await interaction.editReply({ embeds: [accountNotLinkedEmbed()] })
    return
  }

  const scope = interaction.options.getString('scope') ?? 'squad'

  if (scope === 'squad') {
    // Get user's first squad
    const { data: membership } = await supabaseAdmin
      .from('squad_members')
      .select('squad_id')
      .eq('user_id', profile.id)
      .limit(1)
      .single()

    if (!membership) {
      await interaction.editReply({
        embeds: [errorEmbed("Tu n'as aucune squad.")],
      })
      return
    }

    // Get squad members with XP
    const { data: members } = await supabaseAdmin
      .from('squad_members')
      .select('user_id, profiles(username, xp, level, reliability_score)')
      .eq('squad_id', membership.squad_id)
      .order('profiles(xp)', { ascending: false })
      .limit(10)

    const { data: squad } = await supabaseAdmin
      .from('squads')
      .select('name')
      .eq('id', membership.squad_id)
      .single()

    if (!members?.length) {
      await interaction.editReply({
        embeds: [errorEmbed('Aucun membre trouve.')],
      })
      return
    }

    const medals = ['🥇', '🥈', '🥉']
    const lines = members.map((m, i) => {
      const p = m.profiles as unknown as {
        username: string
        xp: number
        level: number
        reliability_score: number
      } | null
      if (!p) return `${i + 1}. ???`
      const prefix = i < 3 ? medals[i] : `${i + 1}.`
      return `${prefix} **${p.username}** — Nv.${p.level} | ${p.xp.toLocaleString()} XP | Fiabilite: ${p.reliability_score}%`
    })

    await interaction.editReply({
      embeds: [
        baseEmbed()
          .setTitle(`🏆 Leaderboard — ${squad?.name ?? 'Squad'}`)
          .setDescription(lines.join('\n')),
      ],
    })
  } else {
    // Global leaderboard — top players by XP
    const { data: topPlayers } = await supabaseAdmin
      .from('profiles')
      .select('username, xp, level, reliability_score')
      .order('xp', { ascending: false })
      .limit(10)

    if (!topPlayers?.length) {
      await interaction.editReply({
        embeds: [errorEmbed('Aucun joueur trouve.')],
      })
      return
    }

    const medals = ['🥇', '🥈', '🥉']
    const lines = topPlayers.map((p, i) => {
      const prefix = i < 3 ? medals[i] : `${i + 1}.`
      return `${prefix} **${p.username}** — Nv.${p.level} | ${p.xp.toLocaleString()} XP | Fiabilite: ${p.reliability_score}%`
    })

    await interaction.editReply({
      embeds: [baseEmbed().setTitle('🏆 Leaderboard Global').setDescription(lines.join('\n'))],
    })
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Classement des joueurs (Premium)')
    .addStringOption((opt) =>
      opt
        .setName('scope')
        .setDescription('Classement de la squad ou global')
        .addChoices({ name: 'Ma Squad', value: 'squad' }, { name: 'Global', value: 'global' })
    ),
  execute,
} satisfies BotCommand
