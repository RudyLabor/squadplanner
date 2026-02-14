import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/profile', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
}))

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => children,
    m: new Proxy({}, {
      get: (_target: any, prop: string) => {
        if (typeof prop === 'string') {
          return ({ children, ...rest }: any) => createElement(prop, rest, children)
        }
        return undefined
      }
    }),
    motion: new Proxy({}, {
      get: (_target: any, prop: string) => {
        if (typeof prop === 'string') {
          return ({ children, ...rest }: any) => createElement(prop, rest, children)
        }
        return undefined
      }
    }),
  }
})

// Mock icons
vi.mock('../../components/icons', () => ({
  LogOut: ({ children, ...props }: any) => createElement('span', props, children),
}))

// Mock UI components
vi.mock('../../components/ui', () => ({
  ProfileSkeleton: () => createElement('div', { 'data-testid': 'profile-skeleton' }, 'Loading...'),
}))

// Mock hooks
vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({
      user: { id: 'user-1' },
      profile: {
        id: 'user-1',
        username: 'TestUser',
        xp: 500,
        level: 3,
        reliability_score: 85,
        streak_days: 5,
      },
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      isLoading: false,
      isInitialized: true,
      refreshProfile: vi.fn(),
    }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
  usePremiumStore: Object.assign(
    vi.fn().mockReturnValue({
      hasPremium: false,
      canAccessFeature: vi.fn().mockReturnValue(true),
      fetchPremiumStatus: vi.fn(),
    }),
    { getState: vi.fn().mockReturnValue({ hasPremium: false, fetchPremiumStatus: vi.fn() }) }
  ),
}))

// Mock React Query hooks
vi.mock('../../hooks/queries', () => ({
  useAICoachQuery: vi.fn().mockReturnValue({ data: null }),
  useChallengesQuery: vi.fn().mockReturnValue({ data: null, isSuccess: false }),
  useClaimChallengeXPMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
}))

// Mock toast
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

// Mock profile sub-components
vi.mock('../../components/PremiumUpgradeModal', () => ({
  PremiumUpgradeModal: () => null,
}))

vi.mock('../../components/XPBar', () => ({
  XPBar: ({ currentXP, level }: any) =>
    createElement('div', { 'data-testid': 'xp-bar' }, `XP: ${currentXP} Level: ${level}`),
}))

vi.mock('../../components/LevelUpCelebration', () => ({
  LevelUpCelebration: () => null,
}))

vi.mock('../../components/Challenges', () => ({
  Challenges: () => createElement('div', { 'data-testid': 'challenges' }, 'Challenges'),
}))

vi.mock('../../components/SeasonalBadges', () => ({
  SeasonalBadges: () => null,
}))

vi.mock('../../components/profile/ProfileHeader', () => ({
  ProfileHeader: ({ profile }: any) =>
    createElement('div', { 'data-testid': 'profile-header' }, profile?.username || 'No user'),
}))

vi.mock('../../components/profile/ProfileStats', () => ({
  ProfileStats: () =>
    createElement('div', { 'data-testid': 'profile-stats' }, 'Stats'),
}))

vi.mock('../../components/profile/ProfileBadges', () => ({
  ProfileBadges: () =>
    createElement('div', { 'data-testid': 'profile-badges' }, 'Badges'),
}))

vi.mock('../../components/profile/ProfileHistory', () => ({
  ProfileHistory: () =>
    createElement('div', { 'data-testid': 'profile-history' }, 'History'),
}))

import { Profile } from '../Profile'

describe('Profile', () => {
  it('renders without crashing', () => {
    render(createElement(Profile))
    expect(screen.getByLabelText('Profil')).toBeTruthy()
  })

  it('renders the profile header with username', () => {
    render(createElement(Profile))
    expect(screen.getByTestId('profile-header')).toBeTruthy()
    expect(screen.getByText('TestUser')).toBeTruthy()
  })

  it('renders XP bar', () => {
    render(createElement(Profile))
    expect(screen.getByTestId('xp-bar')).toBeTruthy()
  })

  it('renders profile stats section', () => {
    render(createElement(Profile))
    expect(screen.getByTestId('profile-stats')).toBeTruthy()
  })

  it('renders sign out button', () => {
    render(createElement(Profile))
    expect(screen.getByText('Se déconnecter')).toBeTruthy()
  })

  it('renders profile badges section', () => {
    render(createElement(Profile))
    expect(screen.getByTestId('profile-badges')).toBeTruthy()
  })
})
