// Level badge colors based on level ranges
export const getLevelColor = (level: number): { color: string; bg15: string; bg20: string } => {
  if (level >= 50)
    return {
      color: 'var(--color-gold)',
      bg15: 'var(--color-gold-15)',
      bg20: 'var(--color-gold-20)',
    }
  if (level >= 30)
    return {
      color: 'var(--color-primary-hover)',
      bg15: 'var(--color-primary-hover-15)',
      bg20: 'var(--color-primary-hover-30)',
    }
  if (level >= 20)
    return {
      color: 'var(--color-success)',
      bg15: 'var(--color-success-15)',
      bg20: 'var(--color-success-20)',
    }
  if (level >= 10)
    return {
      color: 'var(--color-primary)',
      bg15: 'var(--color-primary-15)',
      bg20: 'var(--color-primary-20)',
    }
  return {
    color: 'var(--color-text-secondary)',
    bg15: 'var(--color-overlay-light)',
    bg20: 'var(--color-overlay-medium)',
  }
}

// Medal colors for podium — uses CSS variable opacity variants (Safari 15 compatible, no color-mix())
export const MEDAL_COLORS = {
  1: {
    primary: 'var(--color-gold)',
    secondary: 'var(--color-warning)',
    glow: 'var(--color-gold-30)',
    primary10: 'var(--color-gold-10)',
    primary20: 'var(--color-gold-20)',
    primary30: 'var(--color-gold-30)',
    primary40: 'var(--color-gold-40)',
    primary50: 'var(--color-gold-50)',
    primary80: 'var(--color-gold-80)',
    secondary20: 'var(--color-warning-20)',
  },
  2: {
    primary: 'var(--color-text-secondary)',
    secondary: 'var(--color-text-quaternary)',
    glow: 'var(--color-overlay-light)',
    primary10: 'var(--color-text-secondary-10)',
    primary20: 'var(--color-text-secondary-20)',
    primary30: 'var(--color-text-secondary-30)',
    primary40: 'var(--color-text-secondary-40)',
    primary50: 'var(--color-text-secondary-50)',
    primary80: 'var(--color-text-secondary-80)',
    secondary20: 'var(--color-text-quaternary-20)',
  },
  3: {
    primary: 'var(--color-orange)',
    secondary: 'var(--color-warning)',
    glow: 'var(--color-orange-30)',
    primary10: 'var(--color-orange-10)',
    primary20: 'var(--color-orange-20)',
    primary30: 'var(--color-orange-30)',
    primary40: 'var(--color-orange-40)',
    primary50: 'var(--color-orange-50)',
    primary80: 'var(--color-orange-80)',
    secondary20: 'var(--color-warning-20)',
  },
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  avatar_url: string | null
  xp: number
  level: number
  reliability_score: number
  streak_days: number
}
