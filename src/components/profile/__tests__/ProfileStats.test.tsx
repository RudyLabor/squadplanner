import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

/* ------------------------------------------------------------------ */
/*  vi.mock calls                                                      */
/* ------------------------------------------------------------------ */
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  m: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
}))

vi.mock('../../icons', () => {
  const h = (name: string) => (props: any) => createElement('span', { 'data-testid': `icon-${name}`, ...props })
  return {
    Calendar: h('Calendar'),
    Check: h('Check'),
    Target: h('Target'),
    Trophy: h('Trophy'),
    Sparkles: h('Sparkles'),
    TrendingUp: h('TrendingUp'),
    Plus: h('Plus'),
    __esModule: true,
  }
})

vi.mock('../../ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', { 'data-testid': 'card', ...props }, children),
  ProgressRing: ({ value }: any) => createElement('div', { 'data-testid': 'progress-ring' }, `${value}%`),
  AnimatedCounter: ({ end, suffix }: any) => createElement('span', { 'data-testid': 'counter' }, `${end}${suffix || ''}`),
  HelpTooltip: ({ children }: any) => createElement('div', null, children),
}))

import { ProfileStats } from '../ProfileStats'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const defaultProfile = {
  reliability_score: 80,
  total_sessions: 10,
  total_checkins: 8,
  level: 3,
  xp: 250,
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('ProfileStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /* ---------- Skeleton (profileReady=false) ---------- */

  it('shows skeleton when not ready', () => {
    const { container } = render(<ProfileStats profile={null} profileReady={false} />)
    const pulses = container.querySelectorAll('.animate-pulse')
    expect(pulses.length).toBeGreaterThan(0)
  })

  it('shows 4 skeleton stat cards when not ready', () => {
    render(<ProfileStats profile={null} profileReady={false} />)
    const section = screen.getByLabelText('Statistiques')
    expect(section).toBeInTheDocument()
    const cards = section.querySelectorAll('[data-testid="card"]')
    expect(cards).toHaveLength(4)
  })

  it('does not show stat labels in skeleton mode', () => {
    render(<ProfileStats profile={null} profileReady={false} />)
    expect(screen.queryByText('Sessions')).not.toBeInTheDocument()
    expect(screen.queryByText('Check-ins')).not.toBeInTheDocument()
  })

  it('handles null profile gracefully', () => {
    expect(() => render(<ProfileStats profile={null} profileReady={false} />)).not.toThrow()
  })

  /* ---------- Ready state basic rendering ---------- */

  it('renders Statistiques section when ready', () => {
    render(<ProfileStats profile={defaultProfile} profileReady={true} />)
    expect(screen.getByLabelText('Statistiques')).toBeInTheDocument()
  })

  it('renders all 4 stat labels', () => {
    render(<ProfileStats profile={defaultProfile} profileReady={true} />)
    expect(screen.getByText('Sessions')).toBeInTheDocument()
    expect(screen.getByText('Check-ins')).toBeInTheDocument()
    expect(screen.getByText('Niveau')).toBeInTheDocument()
    expect(screen.getByText('XP')).toBeInTheDocument()
  })

  it('renders stat values correctly', () => {
    render(<ProfileStats profile={defaultProfile} profileReady={true} />)
    expect(screen.getByText('10')).toBeInTheDocument()  // Sessions
    expect(screen.getByText('8')).toBeInTheDocument()   // Check-ins
    expect(screen.getByText('3')).toBeInTheDocument()   // Level
    expect(screen.getByText('250')).toBeInTheDocument()  // XP
  })

  it('renders reliability score', () => {
    render(<ProfileStats profile={defaultProfile} profileReady={true} />)
    // AnimatedCounter and ProgressRing both show 80%
    const matches = screen.getAllByText('80%')
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('renders progress ring with correct value', () => {
    render(<ProfileStats profile={defaultProfile} profileReady={true} />)
    const ring = screen.getByTestId('progress-ring')
    expect(ring).toBeInTheDocument()
    expect(ring).toHaveTextContent('80%')
  })

  it('renders "Score de fiabilite" label', () => {
    render(<ProfileStats profile={defaultProfile} profileReady={true} />)
    expect(screen.getByText('Score de fiabilité')).toBeInTheDocument()
  })

  /* ---------- Tier system ---------- */

  it('shows Debutant tier for score < 50', () => {
    render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 30, total_sessions: 1, total_checkins: 1 }} profileReady={true} />)
    expect(screen.getByText('Débutant')).toBeInTheDocument()
  })

  it('shows Confirme tier for score 50-69', () => {
    render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 55, total_sessions: 5, total_checkins: 3 }} profileReady={true} />)
    expect(screen.getByText('Confirmé')).toBeInTheDocument()
  })

  it('shows Expert tier for score 70-84', () => {
    render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 75 }} profileReady={true} />)
    expect(screen.getByText('Expert')).toBeInTheDocument()
  })

  it('shows Master tier for score 85-94', () => {
    render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 90 }} profileReady={true} />)
    expect(screen.getByText('Master')).toBeInTheDocument()
  })

  it('shows Legende tier for score >= 95', () => {
    render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 95 }} profileReady={true} />)
    expect(screen.getByText('Légende')).toBeInTheDocument()
  })

  it('shows Legende at exactly 100', () => {
    render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 100 }} profileReady={true} />)
    expect(screen.getByText('Légende')).toBeInTheDocument()
  })

  /* ---------- New player / hasNoActivity ---------- */

  it('treats new player score as 0 regardless of DB reliability_score', () => {
    render(<ProfileStats profile={{ reliability_score: 100, total_sessions: 0, total_checkins: 0, level: 1, xp: 0 }} profileReady={true} />)
    expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Débutant')).toBeInTheDocument()
  })

  it('shows CTA when no activity', () => {
    render(<ProfileStats profile={{ reliability_score: 0, total_sessions: 0, total_checkins: 0, level: 1, xp: 0 }} profileReady={true} />)
    expect(screen.getByText('Planifie ta première session !')).toBeInTheDocument()
    const link = screen.getByText('Créer une session')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/squads')
  })

  it('does not show CTA when has activity', () => {
    render(<ProfileStats profile={defaultProfile} profileReady={true} />)
    expect(screen.queryByText('Planifie ta première session !')).not.toBeInTheDocument()
  })

  it('considers hasNoActivity only when BOTH sessions and checkins are 0', () => {
    // total_sessions > 0, total_checkins = 0 → not "no activity"
    render(<ProfileStats profile={{ reliability_score: 50, total_sessions: 1, total_checkins: 0, level: 1, xp: 0 }} profileReady={true} />)
    expect(screen.queryByText('Planifie ta première session !')).not.toBeInTheDocument()
    expect(screen.getAllByText('50%').length).toBeGreaterThanOrEqual(1)
  })

  /* ---------- Next tier progress ---------- */

  it('shows next tier info when not at max tier', () => {
    render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 60 }} profileReady={true} />)
    expect(screen.getByText(/restants/)).toBeInTheDocument()
    // Current: Confirmé (minScore=50), next: Expert (minScore=70)
    expect(screen.getByText(/Expert/)).toBeInTheDocument()
  })

  it('shows correct remaining percentage to next tier', () => {
    render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 60 }} profileReady={true} />)
    // Expert minScore (70) - current (60) = 10% remaining
    expect(screen.getByText('10% restants')).toBeInTheDocument()
  })

  it('shows max rank message for Legende tier', () => {
    render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 98 }} profileReady={true} />)
    expect(screen.getByText('Tu as atteint le rang maximum !')).toBeInTheDocument()
    expect(screen.queryByText(/restants/)).not.toBeInTheDocument()
  })

  /* ---------- Glow effect ---------- */

  it('applies glow effect for Master tier', () => {
    const { container } = render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 90 }} profileReady={true} />)
    const glowCard = container.querySelector('.ring-1')
    expect(glowCard).toBeInTheDocument()
  })

  it('applies glow effect for Legende tier', () => {
    const { container } = render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 96 }} profileReady={true} />)
    const glowCard = container.querySelector('.ring-1')
    expect(glowCard).toBeInTheDocument()
  })

  it('does not apply glow for lower tiers', () => {
    const { container } = render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 60 }} profileReady={true} />)
    const glowCard = container.querySelector('.ring-1')
    expect(glowCard).not.toBeInTheDocument()
  })

  /* ---------- Icons ---------- */

  it('shows TrendingUp icon for non-glow tiers', () => {
    render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 60 }} profileReady={true} />)
    expect(screen.getByTestId('icon-TrendingUp')).toBeInTheDocument()
  })

  it('shows Sparkles icon for glow tiers', () => {
    render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 90 }} profileReady={true} />)
    // Multiple Sparkles icons may exist (one for max rank message, one for glow animation)
    const sparkles = screen.getAllByTestId('icon-Sparkles')
    expect(sparkles.length).toBeGreaterThanOrEqual(1)
  })

  /* ---------- Default/fallback values ---------- */

  it('defaults to 0 sessions when profile.total_sessions is undefined', () => {
    render(<ProfileStats profile={{ level: 1, xp: 0 }} profileReady={true} />)
    // total_sessions defaults to 0, total_checkins defaults to 0
    // hasNoActivity = true, reliabilityScore = 0
    expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Planifie ta première session !')).toBeInTheDocument()
  })

  it('defaults level to 1 when undefined', () => {
    render(<ProfileStats profile={{ total_sessions: 1, total_checkins: 1, reliability_score: 50 }} profileReady={true} />)
    // Level defaults to 1, appears in the stat grid
    const matches = screen.getAllByText('1')
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('defaults xp to 0 when undefined', () => {
    render(<ProfileStats profile={{ total_sessions: 1, total_checkins: 1, reliability_score: 50, level: 1 }} profileReady={true} />)
    const counters = screen.getAllByTestId('counter')
    // xp counter should show 0
    const xpCounter = counters.find(c => c.textContent === '0')
    expect(xpCounter).toBeTruthy()
  })

  /* ---------- Edge: score boundaries ---------- */

  it('shows Debutant at score 0 with activity', () => {
    render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 0, total_sessions: 1, total_checkins: 1 }} profileReady={true} />)
    expect(screen.getByText('Débutant')).toBeInTheDocument()
    expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(1)
  })

  it('shows Confirme at exactly score 50', () => {
    render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 50 }} profileReady={true} />)
    expect(screen.getByText('Confirmé')).toBeInTheDocument()
  })

  it('shows Expert at exactly score 70', () => {
    render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 70 }} profileReady={true} />)
    expect(screen.getByText('Expert')).toBeInTheDocument()
  })

  it('shows Master at exactly score 85', () => {
    render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 85 }} profileReady={true} />)
    expect(screen.getByText('Master')).toBeInTheDocument()
  })

  it('shows Legende at exactly score 95', () => {
    render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 95 }} profileReady={true} />)
    expect(screen.getByText('Légende')).toBeInTheDocument()
  })

  it('shows Debutant at score 49 (just below Confirme)', () => {
    render(<ProfileStats profile={{ ...defaultProfile, reliability_score: 49, total_sessions: 1, total_checkins: 1 }} profileReady={true} />)
    expect(screen.getByText('Débutant')).toBeInTheDocument()
  })
})
