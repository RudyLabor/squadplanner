import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { baseEmbed, accountNotLinkedEmbed, errorEmbed } from '../lib/embeds.js'
import type { BotCommand } from '../types.js'

const APP_URL = process.env.APP_URL || 'https://squadplanner.fr'

async function getLinkedProfile(discordUserId: string) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, username')
    .eq('discord_user_id', discordUserId)
    .single()
  return data
}

async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand()

  const profile = await getLinkedProfile(interaction.user.id)
  if (!profile) {
    await interaction.reply({ embeds: [accountNotLinkedEmbed()], ephemeral: true })
    return
  }

  switch (sub) {
    case 'create':
      return handleCreate(interaction, profile.id)
    case 'list':
      return handleList(interaction, profile.id)
    case 'join':
      return handleJoin(interaction, profile.id)
  }
}

async function handleCreate(
  interaction: ChatInputCommandInteraction,
  userId: string,
) {
  await interaction.deferReply()

  const title = interaction.options.getString('titre', true)
  const game = interaction.options.getString('jeu', true)
  const dateStr = interaction.options.getString('date', true)
  const duration = interaction.options.getInteger('duree') ?? 120

  const scheduledAt = new Date(dateStr)
  if (isNaN(scheduledAt.getTime())) {
    await interaction.editReply({
      embeds: [errorEmbed('Format de date invalide. Utilise: `YYYY-MM-DD HH:MM`')],
    })
    return
  }

  if (scheduledAt < new Date()) {
    await interaction.editReply({
      embeds: [errorEmbed('La date doit etre dans le futur.')],
    })
    return
  }

  // Get user's first squad
  const { data: membership } = await supabaseAdmin
    .from('squad_members')
    .select('squad_id, squads(name)')
    .eq('user_id', userId)
    .limit(1)
    .single()

  if (!membership) {
    await interaction.editReply({
      embeds: [errorEmbed(`Tu n'as aucune squad. Cree-en une sur [squadplanner.fr](${APP_URL})`)],
    })
    return
  }

  const { data: session, error } = await supabaseAdmin
    .from('sessions')
    .insert({
      squad_id: membership.squad_id,
      title,
      game,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: duration,
      created_by: userId,
      status: 'proposed',
    })
    .select('id')
    .single()

  if (error) {
    if (error.message?.includes('Limite de 3')) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Limite de 3 sessions/semaine atteinte (tier Free).\n' +
              `Passe Premium pour des sessions illimitees ! [En savoir plus](${APP_URL}/premium)`,
          ),
        ],
      })
      return
    }
    throw error
  }

  // Auto-RSVP the creator
  await supabaseAdmin.from('session_rsvps').insert({
    session_id: session.id,
    user_id: userId,
    response: 'present',
  })

  const ts = Math.floor(scheduledAt.getTime() / 1000)

  await interaction.editReply({
    embeds: [
      baseEmbed()
        .setTitle('Session creee !')
        .addFields(
          { name: 'Titre', value: title, inline: true },
          { name: 'Jeu', value: game, inline: true },
          { name: 'Date', value: `<t:${ts}:F>`, inline: false },
          { name: 'Duree', value: `${duration} min`, inline: true },
          { name: 'ID', value: `\`${session.id.slice(0, 8)}\``, inline: true },
        )
        .setColor(0x22c55e),
    ],
  })
}

async function handleList(
  interaction: ChatInputCommandInteraction,
  userId: string,
) {
  await interaction.deferReply()

  // Get user's squads
  const { data: memberships } = await supabaseAdmin
    .from('squad_members')
    .select('squad_id')
    .eq('user_id', userId)

  if (!memberships?.length) {
    await interaction.editReply({
      embeds: [errorEmbed("Tu n'as aucune squad.")],
    })
    return
  }

  const squadIds = memberships.map((m) => m.squad_id)

  const { data: sessions } = await supabaseAdmin
    .from('sessions')
    .select('id, title, game, scheduled_at, status, squad_id, squads(name)')
    .in('squad_id', squadIds)
    .in('status', ['proposed', 'confirmed'])
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(10)

  if (!sessions?.length) {
    await interaction.editReply({
      embeds: [baseEmbed().setTitle('Aucune session a venir').setDescription('Cree-en une avec `/session create` !')],
    })
    return
  }

  const lines = sessions.map((s) => {
    const ts = Math.floor(new Date(s.scheduled_at).getTime() / 1000)
    const squadsData = s.squads as unknown as { name: string } | null
    const squadName = squadsData?.name ?? '?'
    const statusIcon = s.status === 'confirmed' ? '✅' : '⏳'
    return `${statusIcon} **${s.title}** (${s.game}) — <t:${ts}:R>\n> Squad: ${squadName} | ID: \`${s.id.slice(0, 8)}\``
  })

  await interaction.editReply({
    embeds: [
      baseEmbed()
        .setTitle(`${sessions.length} session(s) a venir`)
        .setDescription(lines.join('\n\n')),
    ],
  })
}

async function handleJoin(
  interaction: ChatInputCommandInteraction,
  userId: string,
) {
  await interaction.deferReply()

  const sessionIdPrefix = interaction.options.getString('id', true)

  // Find session by ID prefix
  const { data: sessions } = await supabaseAdmin
    .from('sessions')
    .select('id, title, game, scheduled_at')
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

  // Upsert RSVP
  await supabaseAdmin.from('session_rsvps').upsert(
    {
      session_id: session.id,
      user_id: userId,
      response: 'present' as const,
    },
    { onConflict: 'session_id,user_id' },
  )

  const ts = Math.floor(new Date(session.scheduled_at).getTime() / 1000)

  await interaction.editReply({
    embeds: [
      baseEmbed()
        .setTitle('Tu as rejoint la session !')
        .addFields(
          { name: 'Session', value: session.title, inline: true },
          { name: 'Jeu', value: session.game, inline: true },
          { name: 'Date', value: `<t:${ts}:F>`, inline: false },
        )
        .setColor(0x22c55e),
    ],
  })
}

export default {
  data: new SlashCommandBuilder()
    .setName('session')
    .setDescription('Gere les sessions de jeu')
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Cree une nouvelle session')
        .addStringOption((opt) =>
          opt.setName('titre').setDescription('Titre de la session').setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName('jeu').setDescription('Jeu').setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName('date')
            .setDescription('Date et heure (ex: 2026-03-20 21:00)')
            .setRequired(true),
        )
        .addIntegerOption((opt) =>
          opt.setName('duree').setDescription('Duree en minutes (defaut: 120)'),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('list').setDescription('Liste les prochaines sessions'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('join')
        .setDescription('Rejoins une session')
        .addStringOption((opt) =>
          opt.setName('id').setDescription('ID de la session (8 premiers caracteres)').setRequired(true),
        ),
    ),
  execute,
} satisfies BotCommand
