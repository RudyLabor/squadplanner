import { EmbedBuilder } from 'discord.js'

const BRAND_COLOR = 0x7c3aed // Violet SquadPlanner
const APP_URL = process.env.APP_URL || 'https://squadplanner.fr'

export function baseEmbed() {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setFooter({
      text: `Squad Planner | ${APP_URL}`,
    })
    .setTimestamp()
}

export function premiumRequiredEmbed() {
  return baseEmbed()
    .setTitle('Commande Premium')
    .setDescription(
      'Cette commande necessite un abonnement Bot Premium (2,99 EUR/mois).\n\n' +
        "Demande a un admin du serveur d'activer Premium avec `/premium`.\n\n" +
        `[En savoir plus](${APP_URL}/premium)`
    )
}

export function accountNotLinkedEmbed() {
  return baseEmbed()
    .setTitle('Compte non lie')
    .setDescription(
      'Lie ton compte avec `/link [ton_username_SP]` pour utiliser cette commande.\n\n' +
        `Pas encore de compte ? Inscris-toi sur [squadplanner.fr](${APP_URL})`
    )
}

export function errorEmbed(message: string) {
  return baseEmbed().setTitle('Erreur').setDescription(message).setColor(0xef4444)
}

export function successEmbed(title: string, description?: string) {
  const embed = baseEmbed().setTitle(title).setColor(0x22c55e)
  if (description) embed.setDescription(description)
  return embed
}
