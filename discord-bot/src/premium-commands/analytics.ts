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

  const squadId = membership.squad_id
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch squad info
  const { data: squad } = await supabaseAdmin
    .from('squads')
    .select('name, total_members')
    .eq('id', squadId)
    .single()

  // Fetch sessions last 30 days
  const { data: sessions30d } = await supabaseAdmin
    .from('sessions')
    .select('id, status, scheduled_at')
    .eq('squad_id', squadId)
    .gte('scheduled_at', thirtyDaysAgo)

  // Fetch sessions last 90 days for trends
  const { data: sessions90d } = await supabaseAdmin
    .from('sessions')
    .select('id, status, scheduled_at')
    .eq('squad_id', squadId)
    .gte('scheduled_at', ninetyDaysAgo)

  // Fetch RSVPs for the 30-day sessions
  const sessionIds30d = sessions30d?.map((s) => s.id) ?? []
  const { data: rsvps } = sessionIds30d.length
    ? await supabaseAdmin
        .from('session_rsvps')
        .select('user_id, response, session_id')
        .in('session_id', sessionIds30d)
    : { data: [] }

  // Calculate stats
  const total30 = sessions30d?.length ?? 0
  const completed30 = sessions30d?.filter((s) => s.status === 'completed').length ?? 0
  const confirmed30 = sessions30d?.filter((s) => s.status === 'confirmed').length ?? 0
  const cancelled30 = sessions30d?.filter((s) => s.status === 'cancelled').length ?? 0

  // Attendance rate
  const totalRsvps = rsvps?.length ?? 0
  const presentRsvps = rsvps?.filter((r) => r.response === 'present').length ?? 0
  const attendanceRate = totalRsvps > 0 ? Math.round((presentRsvps / totalRsvps) * 100) : 0

  // No-show rate (absent / total)
  const absentRsvps = rsvps?.filter((r) => r.response === 'absent').length ?? 0
  const noshowRate = totalRsvps > 0 ? Math.round((absentRsvps / totalRsvps) * 100) : 0

  // Top players by attendance
  const playerAttendance = new Map<string, number>()
  for (const r of rsvps ?? []) {
    if (r.response === 'present') {
      playerAttendance.set(r.user_id, (playerAttendance.get(r.user_id) ?? 0) + 1)
    }
  }
  const topPlayerIds = [...playerAttendance.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((e) => e[0])

  let topPlayersText = 'Aucune donnee'
  if (topPlayerIds.length) {
    const { data: topProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .in('id', topPlayerIds)

    const profileMap = new Map(topProfiles?.map((p) => [p.id, p.username]) ?? [])
    topPlayersText = topPlayerIds
      .map((id, i) => {
        const medals = ['🥇', '🥈', '🥉', '4.', '5.']
        return `${medals[i]} **${profileMap.get(id) ?? '?'}** — ${playerAttendance.get(id)} sessions`
      })
      .join('\n')
  }

  // Most active days
  const dayCounts = new Map<number, number>()
  for (const s of sessions30d ?? []) {
    const day = new Date(s.scheduled_at).getDay()
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1)
  }
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const topDays = [...dayCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([day, count]) => `${dayNames[day]}: ${count} sessions`)
    .join(', ')

  // Trend: compare last 30d vs previous 30d
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  const prev30 =
    sessions90d?.filter((s) => {
      const d = new Date(s.scheduled_at)
      return d >= sixtyDaysAgo && d < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }).length ?? 0
  const trendIcon = total30 > prev30 ? '📈' : total30 < prev30 ? '📉' : '➡️'
  const trendText =
    prev30 > 0
      ? `${trendIcon} ${total30 > prev30 ? '+' : ''}${total30 - prev30} vs mois precedent`
      : 'Pas de donnees precedentes'

  await interaction.editReply({
    embeds: [
      baseEmbed()
        .setTitle(`📊 Analytics — ${squad?.name ?? 'Squad'}`)
        .setDescription(`Statistiques detaillees des 30 derniers jours\n${trendText}`)
        .addFields(
          { name: 'Sessions', value: `${total30}`, inline: true },
          { name: 'Completees', value: `${completed30}`, inline: true },
          { name: 'Annulees', value: `${cancelled30}`, inline: true },
          { name: 'Taux de presence', value: `${attendanceRate}%`, inline: true },
          { name: 'Taux de no-show', value: `${noshowRate}%`, inline: true },
          { name: 'Membres', value: `${squad?.total_members ?? '?'}`, inline: true },
          { name: 'Jours les plus actifs', value: topDays || 'N/A', inline: false },
          { name: 'Top joueurs', value: topPlayersText, inline: false }
        ),
    ],
  })
}

export default {
  data: new SlashCommandBuilder()
    .setName('analytics')
    .setDescription('Stats avancees de ta squad (Premium)'),
  execute,
} satisfies BotCommand
