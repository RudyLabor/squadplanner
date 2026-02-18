import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { baseEmbed } from '../lib/embeds.js'
import type { BotCommand } from '../types.js'

const APP_URL = process.env.APP_URL || 'https://squadplanner.fr'

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply()

  const game = interaction.options.getString('jeu', true).toLowerCase()
  const rank = interaction.options.getString('rang')

  // Search for players looking for squad, matching the game
  let query = supabaseAdmin
    .from('profiles')
    .select('username, avatar_url, level, reliability_score, preferred_games')
    .eq('looking_for_squad', true)
    .order('reliability_score', { ascending: false })
    .limit(10)

  const { data: players } = await query

  // Filter by game match (preferred_games is a text array)
  const filtered = players?.filter((p) => {
    const games = (p.preferred_games as string[] | null) ?? []
    return games.some((g) => g.toLowerCase().includes(game))
  }) ?? []

  if (!filtered.length) {
    await interaction.editReply({
      embeds: [
        baseEmbed()
          .setTitle(`LFG — ${game}`)
          .setDescription(
            `Aucun joueur disponible pour **${game}** en ce moment.\n\n` +
              `Active "Cherche squad" sur [ton profil](${APP_URL}/profile) pour apparaitre ici !`,
          ),
      ],
    })
    return
  }

  const lines = filtered.map((p, i) => {
    const levelBadge = `Nv.${p.level ?? 1}`
    const reliability = p.reliability_score != null ? `${p.reliability_score}%` : '?'
    return `**${i + 1}.** ${p.username} — ${levelBadge} | Fiabilite: ${reliability}`
  })

  await interaction.editReply({
    embeds: [
      baseEmbed()
        .setTitle(`LFG — ${game}${rank ? ` (${rank}+)` : ''}`)
        .setDescription(
          `${filtered.length} joueur(s) disponible(s) :\n\n${lines.join('\n')}\n\n` +
            `Contacte-les sur [squadplanner.fr](${APP_URL}/discover)`,
        ),
    ],
  })
}

export default {
  data: new SlashCommandBuilder()
    .setName('lfg')
    .setDescription('Trouve des joueurs pour une game')
    .addStringOption((opt) =>
      opt.setName('jeu').setDescription('Jeu recherche').setRequired(true),
    )
    .addStringOption((opt) =>
      opt.setName('rang').setDescription('Rang minimum (optionnel)'),
    ),
  execute,
} satisfies BotCommand
