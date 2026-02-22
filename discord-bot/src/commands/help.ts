import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { baseEmbed } from '../lib/embeds.js'
import type { BotCommand } from '../types.js'

const APP_URL = process.env.APP_URL || 'https://squadplanner.fr'

async function execute(interaction: ChatInputCommandInteraction) {
  const embed = baseEmbed()
    .setTitle('Squad Planner — Aide')
    .setDescription(
      'Organise tes sessions gaming directement depuis Discord !\n\n' +
        `**[squadplanner.fr](${APP_URL})** — L'app complete pour gerer tes squads.`
    )
    .addFields(
      {
        name: '🔗 Premiers pas',
        value: '`/link [username]` — Lie ton compte Discord a Squad Planner',
      },
      {
        name: '🎮 Sessions (gratuit)',
        value:
          '`/session create` — Cree une session\n' +
          '`/session list` — Prochaines sessions\n' +
          '`/session join [id]` — Rejoins une session',
      },
      {
        name: '✅ RSVP (gratuit)',
        value: '`/rsvp [session] [reponse]` — Reponds present, absent ou peut-etre',
      },
      {
        name: '👥 Squad (gratuit)',
        value:
          '`/squad info` — Infos de tes squads\n' + '`/squad stats` — Stats des 30 derniers jours',
      },
      {
        name: '🔍 LFG (gratuit)',
        value: '`/lfg [jeu]` — Trouve des joueurs disponibles',
      },
      {
        name: '⭐ Premium (2,99 EUR/mois par serveur)',
        value:
          '`/recurring` — Sessions recurrentes\n' +
          '`/analytics` — Stats avancees\n' +
          '`/coach` — Conseils IA personnalises\n' +
          '`/leaderboard` — Classement des joueurs\n' +
          '`/remind` — Rappels de session\n\n' +
          '`/premium` — Activer Premium sur ce serveur',
      }
    )

  await interaction.reply({ embeds: [embed] })
}

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription("Affiche l'aide et la liste des commandes"),
  execute,
} satisfies BotCommand
