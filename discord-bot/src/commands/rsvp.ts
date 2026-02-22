import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { baseEmbed, accountNotLinkedEmbed, errorEmbed } from '../lib/embeds.js'
import type { BotCommand } from '../types.js'

const RSVP_LABELS: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  maybe: 'Peut-etre',
}

const RSVP_COLORS: Record<string, number> = {
  present: 0x22c55e,
  absent: 0xef4444,
  maybe: 0xf59e0b,
}

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
  const response = interaction.options.getString('reponse', true) as 'present' | 'absent' | 'maybe'

  // Find session by ID prefix
  const { data: sessions } = await supabaseAdmin
    .from('sessions')
    .select('id, title, game, scheduled_at')
    .like('id', `${sessionIdPrefix}%`)
    .in('status', ['proposed', 'confirmed'])
    .limit(1)

  if (!sessions?.length) {
    await interaction.editReply({
      embeds: [errorEmbed("Session non trouvee. Verifie l'ID avec `/session list`.")],
    })
    return
  }

  const session = sessions[0]

  // Upsert RSVP
  await supabaseAdmin.from('session_rsvps').upsert(
    {
      session_id: session.id,
      user_id: profile.id,
      response,
    },
    { onConflict: 'session_id,user_id' }
  )

  const ts = Math.floor(new Date(session.scheduled_at).getTime() / 1000)

  await interaction.editReply({
    embeds: [
      baseEmbed()
        .setTitle(`RSVP : ${RSVP_LABELS[response]}`)
        .setColor(RSVP_COLORS[response])
        .addFields(
          { name: 'Session', value: session.title, inline: true },
          { name: 'Jeu', value: session.game, inline: true },
          { name: 'Date', value: `<t:${ts}:F>`, inline: false }
        )
        .setDescription(`${profile.username} a repondu **${RSVP_LABELS[response]}**`),
    ],
  })
}

export default {
  data: new SlashCommandBuilder()
    .setName('rsvp')
    .setDescription('Reponds a une session')
    .addStringOption((opt) =>
      opt
        .setName('session')
        .setDescription('ID de la session (8 premiers caracteres)')
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('reponse')
        .setDescription('Ta reponse')
        .setRequired(true)
        .addChoices(
          { name: 'Present', value: 'present' },
          { name: 'Absent', value: 'absent' },
          { name: 'Peut-etre', value: 'maybe' }
        )
    ),
  execute,
} satisfies BotCommand
