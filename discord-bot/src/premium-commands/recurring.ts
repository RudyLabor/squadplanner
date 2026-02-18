import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { baseEmbed, accountNotLinkedEmbed, errorEmbed } from '../lib/embeds.js'
import type { BotCommand } from '../types.js'

const DAYS_FR: Record<string, number> = {
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  dimanche: 0,
}

function getNextDayOfWeek(dayOfWeek: number, hour: number, minute: number): Date {
  const now = new Date()
  const result = new Date(now)
  result.setHours(hour, minute, 0, 0)

  const currentDay = now.getDay()
  let daysUntil = dayOfWeek - currentDay
  if (daysUntil < 0 || (daysUntil === 0 && result <= now)) {
    daysUntil += 7
  }
  result.setDate(result.getDate() + daysUntil)
  return result
}

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

  const game = interaction.options.getString('jeu', true)
  const dayStr = interaction.options.getString('jour', true).toLowerCase()
  const timeStr = interaction.options.getString('heure', true)
  const weeks = interaction.options.getInteger('semaines') ?? 4
  const title = interaction.options.getString('titre') ?? `Session ${game}`

  // Validate day
  const dayOfWeek = DAYS_FR[dayStr]
  if (dayOfWeek === undefined) {
    await interaction.editReply({
      embeds: [errorEmbed('Jour invalide. Utilise: lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche')],
    })
    return
  }

  // Parse time
  const timeParts = timeStr.match(/^(\d{1,2})[h:](\d{2})$/)
  if (!timeParts) {
    await interaction.editReply({
      embeds: [errorEmbed('Format d\'heure invalide. Utilise: `21h00` ou `21:00`')],
    })
    return
  }
  const hour = parseInt(timeParts[1])
  const minute = parseInt(timeParts[2])

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

  // Generate sessions for the next N weeks
  const sessions = []
  let nextDate = getNextDayOfWeek(dayOfWeek, hour, minute)

  for (let i = 0; i < weeks; i++) {
    sessions.push({
      squad_id: membership.squad_id,
      title: `${title} #${i + 1}`,
      game,
      scheduled_at: new Date(nextDate).toISOString(),
      duration_minutes: 120,
      created_by: profile.id,
      status: 'proposed' as const,
    })
    nextDate = new Date(nextDate.getTime() + 7 * 24 * 60 * 60 * 1000)
  }

  const { error } = await supabaseAdmin.from('sessions').insert(sessions)

  if (error) {
    if (error.message?.includes('Limite de 3')) {
      await interaction.editReply({
        embeds: [errorEmbed('Limite de sessions atteinte pour le tier Free.')],
      })
      return
    }
    throw error
  }

  // Auto-RSVP creator for all sessions
  const { data: insertedSessions } = await supabaseAdmin
    .from('sessions')
    .select('id')
    .eq('created_by', profile.id)
    .eq('game', game)
    .order('created_at', { ascending: false })
    .limit(weeks)

  if (insertedSessions) {
    const rsvps = insertedSessions.map((s) => ({
      session_id: s.id,
      user_id: profile.id,
      response: 'present' as const,
    }))
    await supabaseAdmin.from('session_rsvps').insert(rsvps)
  }

  const firstTs = Math.floor(new Date(sessions[0].scheduled_at).getTime() / 1000)
  const lastTs = Math.floor(new Date(sessions[sessions.length - 1].scheduled_at).getTime() / 1000)

  await interaction.editReply({
    embeds: [
      baseEmbed()
        .setTitle(`${weeks} sessions recurrentes creees !`)
        .setColor(0x22c55e)
        .addFields(
          { name: 'Jeu', value: game, inline: true },
          { name: 'Jour', value: dayStr.charAt(0).toUpperCase() + dayStr.slice(1), inline: true },
          { name: 'Heure', value: timeStr, inline: true },
          { name: 'Premiere', value: `<t:${firstTs}:D>`, inline: true },
          { name: 'Derniere', value: `<t:${lastTs}:D>`, inline: true },
        ),
    ],
  })
}

export default {
  data: new SlashCommandBuilder()
    .setName('recurring')
    .setDescription('Cree des sessions recurrentes (Premium)')
    .addStringOption((opt) =>
      opt.setName('jeu').setDescription('Jeu').setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('jour')
        .setDescription('Jour de la semaine (ex: mardi)')
        .setRequired(true)
        .addChoices(
          { name: 'Lundi', value: 'lundi' },
          { name: 'Mardi', value: 'mardi' },
          { name: 'Mercredi', value: 'mercredi' },
          { name: 'Jeudi', value: 'jeudi' },
          { name: 'Vendredi', value: 'vendredi' },
          { name: 'Samedi', value: 'samedi' },
          { name: 'Dimanche', value: 'dimanche' },
        ),
    )
    .addStringOption((opt) =>
      opt.setName('heure').setDescription("Heure (ex: 21h00 ou 21:00)").setRequired(true),
    )
    .addIntegerOption((opt) =>
      opt.setName('semaines').setDescription('Nombre de semaines (defaut: 4, max: 12)').setMinValue(1).setMaxValue(12),
    )
    .addStringOption((opt) =>
      opt.setName('titre').setDescription('Titre personnalise (optionnel)'),
    ),
  execute,
} satisfies BotCommand
