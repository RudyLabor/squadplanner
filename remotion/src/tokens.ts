// Miroir exact de src/lib/theme.ts — Design tokens Linear Dark
export const tokens = {
  // Backgrounds
  bgBase: '#08090a',
  bgElevated: '#101012',
  bgSurface: '#18191b',
  bgHover: '#1f2023',
  bgActive: '#27282b',
  bgPhone: '#050506',
  bgPhoneBody: '#0a0a0c',

  // Text
  textPrimary: '#f7f8f8',
  textSecondary: '#c9cace',
  textTertiary: '#8b8d90',
  textQuaternary: '#5e6063',
  textMuted: '#7d7d82',
  textSubtle: '#a1a1a6',

  // Accents
  primary: '#5e6dd2',
  primaryHover: '#6a79db',
  indigo: '#6366f1',
  success: '#4ade80',
  warning: '#f5a623',
  info: '#60a5fa',
  purple: '#8b93ff',
  lavender: '#a78bfa',
  error: '#f87171',
  emerald: '#34d399',
  cyan: '#06B6D4',

  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderDefault: 'rgba(255, 255, 255, 0.08)',
  borderHover: 'rgba(255, 255, 255, 0.12)',
  borderIndigo: 'rgba(99, 102, 241, 0.15)',
} as const;

// Mock members — same as HeroMockup.tsx
export const mockMembers = [
  { name: 'Max', initial: 'M', color: '#6366f1', score: 94 },
  { name: 'Luna', initial: 'L', color: '#34d399', score: 100 },
  { name: 'Kira', initial: 'K', color: '#f5a623', score: 87 },
  { name: 'Jay', initial: 'J', color: '#a78bfa', score: 92 },
  { name: 'Zoé', initial: 'Z', color: '#f87171', score: 78 },
] as const;
