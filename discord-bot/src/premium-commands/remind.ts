import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { baseEmbed, accountNotLinkedEmbed, errorEmbed, successEmbed } from '../lib/embeds.js'
import type { BotCommand } from '../types.js'

// In-memory reminders (cleared on restart — good enough for MVP)
const activeReminders = new Map<string, NodeJS.Timeout>()

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

  const sessionIdPrefix = interaction.options.getString('session', true)
  const delay = interaction.options.getString('delai', true)

  // Find session
  const { data: sessions } = await supabaseAdmin
    .from('sessions')
    .select('id, title, game, scheduled_at, squad_id')
    .like('id', `${sessionIdPrefix}%`)
    .in('status', ['proposed', 'confirmed'])
    .limit(1)

  if (!sessions?.length) {
    await interaction.editReply({
      embeds: [errorEmbed('Session non trouvee. Verifie l\'ID avec `/session list`.')],
    })
    return
  }

  const session = sessions[0]
  const scheduledAt = new Date(session.scheduled_at)

  // Calculate reminder time
  const delayMinutes: Record<string, number> = {
    '15min': 15,
    '1h': 60,
    '24h': 24 * 60,
  }
  const minutesBefore = delayMinutes[delay]
  if (!minutesBefore) {
    await interaction.editReply({
      embeds: [errorEmbed('Delai invalide.')],
    })
    return
  }

  const reminderTime = new Date(scheduledAt.getTime() - minutesBefore * 60 * 1000)
  const now = new Date()

  if (reminderTime <= now) {
    await interaction.editReply({
      embeds: [errorEmbed("Le rappel serait dans le passe. La session est trop proche ou deja passee.")],
    })
    return
  }

  const msUntilReminder = reminderTime.getTime() - now.getTime()

  // Cancel existing reminder for this session in this channel
  const reminderId = `${session.id}-${interaction.channelId}`
  const existing = activeReminders.get(reminderId)
  if (existing) {
    clearTimeout(existing)
  }

  // Set the reminder
  const timeout = setTimeout(async () => {
    try {
      const channel = interaction.channel
      if (!channel || !('send' in channel)) return

      const ts = Math.floor(scheduledAt.getTime() / 1000)

      // Get RSVP count
      const { count } = await supabaseAdmin
        .from('session_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id)
        .eq('response', 'present')

      await channel.send({
        embeds: [
          baseEmbed()
            .setTitle('⏰ Rappel de session !')
            .setDescription(
              `**${session.title}** commence <t:${ts}:R> !\n\n` +
                `🎮 ${session.game}\n` +
                `👥 ${count ?? 0} joueur(s) confirme(s)\n\n` +
                `N'oublie pas de RSVP avec \`/rsvp ${session.id.slice(0, 8)} present\``,
            )
            .setColor(0xf59e0b),
        ],
      })

      activeReminders.delete(reminderId)
    } catch (err) {
      console.error('[Remind] Error sending reminder:', err)
    }
  }, msUntilReminder)

  activeReminders.set(reminderId, timeout)

  const reminderTs = Math.floor(reminderTime.getTime() / 1000)
  const sessionTs = Math.floor(scheduledAt.getTime() / 1000)

  await interaction.editReply({
    embeds: [
      successEmbed(
        'Rappel programme !',
        `**${session.title}** (${session.game})\n\n` +
          `📅 Session : <t:${sessionTs}:F>\n` +
          `⏰ Rappel : <t:${reminderTs}:F> (<t:${reminderTs}:R>)`,
      ),
    ],
  })
}

export default {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Programme un rappel pour une session (Premium)')
    .addStringOption((opt) =>
      opt
        .setName('session')
        .setDescription('ID de la session (8 premiers caracteres)')
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('delai')
        .setDescription('Quand envoyer le rappel')
        .setRequired(true)
        .addChoices(
          { name: '15 minutes avant', value: '15min' },
          { name: '1 heure avant', value: '1h' },
          { name: '24 heures avant', value: '24h' },
        ),
    ),
  execute,
} satisfies BotCommand
