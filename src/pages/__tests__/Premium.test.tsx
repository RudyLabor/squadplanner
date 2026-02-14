import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/premium', hash: '', search: '' }),
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

// Mock hooks
vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
  useSubscriptionStore: Object.assign(
    vi.fn().mockReturnValue({
      createCheckoutSession: vi.fn().mockResolvedValue({ url: 'https://example.com', error: null }),
      createPortalSession: vi.fn().mockResolvedValue({ url: 'https://example.com', error: null }),
      plans: [],
    }),
    { getState: vi.fn().mockReturnValue({ plans: [] }) }
  ),
  usePremiumStore: Object.assign(
    vi.fn().mockReturnValue({
      hasPremium: false,
      canAccessFeature: vi.fn().mockReturnValue(true),
      fetchPremiumStatus: vi.fn(),
    }),
    { getState: vi.fn().mockReturnValue({ hasPremium: false, fetchPremiumStatus: vi.fn() }) }
  ),
  useAnalytics: vi.fn().mockReturnValue({
    track: vi.fn(),
    identify: vi.fn(),
    page: vi.fn(),
  }),
}))

// Mock toast
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
}))

// Mock sentry
vi.mock('../../lib/sentry', () => ({
  captureException: vi.fn(),
}))

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: { getSession: vi.fn() },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
    rpc: vi.fn(),
  },
}))

// Mock premium sub-components
vi.mock('../premium/PremiumHero', () => ({
  PremiumHero: ({ hasPremium }: any) =>
    createElement('div', { 'data-testid': 'premium-hero' }, hasPremium ? 'Premium Active' : 'Go Premium'),
}))

vi.mock('../premium/PremiumPricing', () => ({
  PremiumPricing: () =>
    createElement('div', { 'data-testid': 'premium-pricing' }, 'Pricing'),
}))

vi.mock('../premium/PremiumFeaturesTable', () => ({
  PremiumFeaturesTable: () =>
    createElement('div', { 'data-testid': 'premium-features' }, 'Features Table'),
}))

vi.mock('../premium/PremiumTestimonials', () => ({
  PremiumTestimonials: () =>
    createElement('div', { 'data-testid': 'premium-testimonials' }, 'Testimonials'),
}))

vi.mock('../premium/PremiumFAQ', () => ({
  PremiumFAQ: () =>
    createElement('div', { 'data-testid': 'premium-faq' }, 'FAQ'),
}))

import { Premium } from '../Premium'

describe('Premium', () => {
  it('renders without crashing', () => {
    render(createElement(Premium))
    expect(screen.getByLabelText('Premium')).toBeTruthy()
  })

  it('renders the hero section', () => {
    render(createElement(Premium))
    expect(screen.getByTestId('premium-hero')).toBeTruthy()
  })

  it('renders pricing section when user is not premium', () => {
    render(createElement(Premium))
    expect(screen.getByTestId('premium-pricing')).toBeTruthy()
  })

  it('renders features table', () => {
    render(createElement(Premium))
    expect(screen.getByTestId('premium-features')).toBeTruthy()
  })

  it('renders testimonials section', () => {
    render(createElement(Premium))
    expect(screen.getByTestId('premium-testimonials')).toBeTruthy()
  })

  it('renders FAQ section', () => {
    render(createElement(Premium))
    expect(screen.getByTestId('premium-faq')).toBeTruthy()
  })
})
