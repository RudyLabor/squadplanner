import {
  Crown,
  Flame,
  Star,
  Zap,
  Target,
  Trophy,
  Award,
  Sparkles,
} from '../icons'
export interface BadgeConfig {
  icon: React.ElementType
  color: string
  bgColor: string
  glowColor: string
  label: string
  description: string
}

export const BADGE_CONFIGS: Record<string, BadgeConfig> = {
  mvp: { icon: Crown, color: 'var(--color-warning)', bgColor: 'var(--color-warning-15)', glowColor: 'var(--color-warning-30)', label: 'MVP', description: 'Meilleur joueur du mois' },
  most_reliable: { icon: Target, color: 'var(--color-success)', bgColor: 'var(--color-success-15)', glowColor: 'var(--color-success-30)', label: 'Plus fiable', description: 'Plus fiable du mois' },
  party_animal: { icon: Flame, color: 'var(--color-pink)', bgColor: 'var(--color-pink-15)', glowColor: 'var(--color-pink-30)', label: 'Bête de soirée', description: 'Le plus actif en party' },
  top_scorer: { icon: Star, color: 'var(--color-purple)', bgColor: 'var(--color-purple-15)', glowColor: 'var(--color-purple-20)', label: 'Meilleur scoreur', description: 'Plus de XP gagné' },
  streak_master: { icon: Zap, color: 'var(--color-cyan)', bgColor: 'var(--color-cyan-15)', glowColor: 'var(--color-cyan-30)', label: 'Maître de la série', description: 'Plus longue série' },
  squad_champion: { icon: Trophy, color: 'var(--color-orange)', bgColor: 'var(--color-orange-15)', glowColor: 'var(--color-orange-30)', label: 'Champion de squad', description: 'Champion de la squad' },
  rising_star: { icon: Sparkles, color: 'var(--color-primary-hover)', bgColor: 'var(--color-primary-hover-15)', glowColor: 'var(--color-primary-hover-30)', label: 'Étoile montante', description: 'Progression exceptionnelle' },
  legend: { icon: Award, color: 'var(--color-rose)', bgColor: 'var(--color-rose-15)', glowColor: 'var(--color-rose-30)', label: 'Légende', description: 'Statut légendaire atteint' }
}

export function formatSeason(season: string): string {
  const [year, month] = season.split('-')
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  const monthIndex = parseInt(month, 10) - 1
  return `${months[monthIndex]} ${year}`
}

export interface SeasonalBadge {
  id: string
  user_id: string
  badge_type: string
  season: string
  squad_id: string | null
  awarded_at: string
  squad_name?: string
}
