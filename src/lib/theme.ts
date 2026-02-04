// Design tokens from Linear Dark theme
export const theme = {
  colors: {
    // Backgrounds
    bgBase: '#08090a',
    bgElevated: '#101012',
    bgSurface: '#18191b',
    bgHover: '#1f2023',
    bgActive: '#27282b',

    // Text
    textPrimary: '#f7f8f8',
    textSecondary: '#c9cace',
    textTertiary: '#8b8d90',
    textQuaternary: '#5e6063',

    // Accents
    primary: '#5e6dd2',
    primaryHover: '#6a79db',
    success: '#4ade80',
    warning: '#f5a623',
    info: '#60a5fa',
    purple: '#8b93ff',
    error: '#f87171',

    // Borders
    borderSubtle: 'rgba(255, 255, 255, 0.06)',
    borderDefault: 'rgba(255, 255, 255, 0.08)',
    borderHover: 'rgba(255, 255, 255, 0.12)',
  },

  // Animation variants for Framer Motion
  animation: {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.05,
          delayChildren: 0.02,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 6 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.14,
          ease: [0.25, 0.1, 0.25, 1],
        },
      },
    },
    hover: {
      y: -2,
      scale: 1.01,
    },
    tap: {
      scale: 0.98,
    },
  },

  // Icon colors by category
  iconColors: {
    squads: '#5e6dd2', // Violet - Squads/Gaming
    sessions: '#f5a623', // Orange - Sessions/Time
    stats: '#4ade80', // Green - Stats/Success
    time: '#60a5fa', // Blue - Time/Clock
    users: '#8b93ff', // Light Purple - Users/Friends
    danger: '#f87171', // Red - Errors/Danger
  },
} as const

export type Theme = typeof theme
