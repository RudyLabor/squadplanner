import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { baseEmbed, accountNotLinkedEmbed, errorEmbed } from '../lib/embeds.js'
import type { BotCommand } from '../types.js'

async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand()

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('discord_user_id', interaction.user.id)
    .single()

  if (!profile) {
    await interaction.reply({ embeds: [accountNotLinkedEmbed()], ephemeral: true })
    return
  }

  switch (sub) {
    case 'info':
      return handleInfo(interaction, profile.id)
    case 'stats':
      return handleStats(interaction, profile.id)
  }
}

async function handleInfo(
  interaction: ChatInputCommandInteraction,
  userId: string,
) {
  await interaction.deferReply()

  // Get user's squads with member count
  const { data: memberships } = await supabaseAdmin
    .from('squad_members')
    .select('squad_id, role, squads(id, name, game, invite_code, is_premium, max_members, total_members)')
    .eq('user_id', userId)

  if (!memberships?.length) {
    await interaction.editReply({
      embeds: [errorEmbed("Tu n'as aucune squad.")],
    })
    return
  }

  const embeds = memberships.slice(0, 5).map((m) => {
    const s = m.squads as unknown as {
      id: string
      name: string
      game: string
      invite_code: string
      is_premium: boolean
      max_members: number
      total_members: number
    } | null

    if (!s) return baseEmbed().setTitle('Squad inconnue')

    return baseEmbed()
      .setTitle(`${s.is_premium ? '⭐ ' : ''}${s.name}`)
      .addFields(
        { name: 'Jeu', value: s.game || 'Non defini', inline: true },
        { name: 'Membres', value: `${s.total_members ?? '?'}/${s.max_members}`, inline: true },
        { name: 'Ton role', value: m.role, inline: true },
        { name: 'Code invite', value: `\`${s.invite_code}\``, inline: true },
      )
  })

  await interaction.editReply({ embeds })
}

async function handleStats(
  interaction: ChatInputCommandInteraction,
  userId: string,
) {
  await interaction.deferReply()

  // Get user's first squad for stats
  const { data: membership } = await supabaseAdmin
    .from('squad_members')
    .select('squad_id')
    .eq('user_id', userId)
    .limit(1)
    .single()

  if (!membership) {
    await interaction.editReply({
      embeds: [errorEmbed("Tu n'as aucune squad.")],
    })
    return
  }

  // Get recent sessions stats
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: sessions } = await supabaseAdmin
    .from('sessions')
    .select('id, status')
    .eq('squad_id', membership.squad_id)
    .gte('created_at', thirtyDaysAgo)

  const { data: squad } = await supabaseAdmin
    .from('squads')
    .select('name, total_members, avg_reliability_score')
    .eq('id', membership.squad_id)
    .single()

  const totalSessions = sessions?.length ?? 0
  const confirmed = sessions?.filter((s) => s.status === 'confirmed').length ?? 0
  const completed = sessions?.filter((s) => s.status === 'completed').length ?? 0

  await interaction.editReply({
    embeds: [
      baseEmbed()
        .setTitle(`Stats — ${squad?.name ?? 'Squad'}`)
        .setDescription('Statistiques des 30 derniers jours')
        .addFields(
          { name: 'Sessions totales', value: `${totalSessions}`, inline: true },
          { name: 'Confirmees', value: `${confirmed}`, inline: true },
          { name: 'Completees', value: `${completed}`, inline: true },
          {
            name: 'Membres',
            value: `${squad?.total_members ?? '?'}`,
            inline: true,
          },
          {
            name: 'Fiabilite moy.',
            value: `${squad?.avg_reliability_score ?? '?'}%`,
            inline: true,
          },
        ),
    ],
  })
}

export default {
  data: new SlashCommandBuilder()
    .setName('squad')
    .setDescription('Infos et stats de tes squads')
    .addSubcommand((sub) =>
      sub.setName('info').setDescription('Affiche tes squads'),
    )
    .addSubcommand((sub) =>
      sub.setName('stats').setDescription('Stats des 30 derniers jours'),
    ),
  execute,
} satisfies BotCommand
