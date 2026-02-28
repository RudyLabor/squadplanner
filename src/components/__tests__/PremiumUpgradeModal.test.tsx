import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

// Mock icons
vi.mock('../icons', () => ({
  Zap: (props: any) => createElement('svg', props),
  Check: (props: any) => createElement('svg', props),
  Crown: (props: any) => createElement('svg', props),
  Sparkles: (props: any) => createElement('svg', props),
  BarChart3: (props: any) => createElement('svg', props),
  Mic2: (props: any) => createElement('svg', props),
  Calendar: (props: any) => createElement('svg', props),
  Users: (props: any) => createElement('svg', props),
  Infinity: (props: any) => createElement('svg', props),
  Loader2: (props: any) => createElement('svg', props),
  X: (props: any) => createElement('svg', props),
}))

// Mock ui
vi.mock('../ui', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) =>
    createElement('button', { onClick, disabled, ...props }, children),
  ResponsiveModal: ({ children, open }: any) =>
    open ? createElement('div', { 'data-testid': 'modal' }, children) : null,
}))

// Mock subscription store
vi.mock('../../hooks', () => ({
  useSubscriptionStore: vi.fn().mockReturnValue({
    createCheckoutSession: vi
      .fn()
      .mockResolvedValue({ url: 'https://checkout.stripe.com/test', error: null }),
    plans: [
      { id: 'premium_monthly', stripePriceId: 'price_monthly' },
      { id: 'premium_yearly', stripePriceId: 'price_yearly' },
    ],
  }),
}))

// Mock premium constants
vi.mock('../../hooks/usePremium', () => ({
  PREMIUM_PRICE_MONTHLY: 6.99,
  PREMIUM_PRICE_YEARLY: 59.88,
  SQUAD_LEADER_PRICE_MONTHLY: 14.99,
  SQUAD_LEADER_PRICE_YEARLY: 143.88,
  CLUB_PRICE_MONTHLY: 39.99,
  CLUB_PRICE_YEARLY: 383.88,
  FEATURE_MIN_TIER: {
    gifs: 'premium',
    voice_messages: 'premium',
    polls: 'premium',
    unlimited_squads: 'squad_leader',
    unlimited_history: 'squad_leader',
    advanced_stats: 'premium',
    ai_coach_advanced: 'squad_leader',
    hd_audio: 'squad_leader',
    advanced_roles: 'squad_leader',
    calendar_export: 'squad_leader',
    recurring_sessions: 'squad_leader',
    team_analytics: 'squad_leader',
    priority_matchmaking: 'squad_leader',
    club_dashboard: 'club',
    custom_branding: 'club',
    api_webhooks: 'club',
  },
}))

import { PremiumUpgradeModal } from '../PremiumUpgradeModal'

describe('PremiumUpgradeModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      createElement(PremiumUpgradeModal, { ...defaultProps, isOpen: false })
    )
    expect(container.querySelector('[data-testid="modal"]')).toBeNull()
  })

  it('renders modal when open', () => {
    render(createElement(PremiumUpgradeModal, defaultProps))
    expect(screen.getByText('Débloque cette fonctionnalité')).toBeDefined()
  })

  it('displays feature when provided', () => {
    render(createElement(PremiumUpgradeModal, { ...defaultProps, feature: 'Heatmaps d\'activité et fiabilité' }))
    expect(screen.getByText(/Pour accéder à/)).toBeDefined()
  })

  it('renders plan selector with monthly and yearly options', () => {
    render(createElement(PremiumUpgradeModal, defaultProps))
    expect(screen.getByText('Mensuel')).toBeDefined()
    expect(screen.getByText('Annuel')).toBeDefined()
  })

  it('renders premium features list', () => {
    render(createElement(PremiumUpgradeModal, defaultProps))
    expect(screen.getByText('5 squads')).toBeDefined()
    expect(screen.getByText('Heatmaps d\'activité et fiabilité')).toBeDefined()
    expect(screen.getByText('IA Coach')).toBeDefined()
  })

  it('calls onClose when close button clicked', () => {
    render(createElement(PremiumUpgradeModal, defaultProps))
    const closeBtn = screen.getByLabelText('Fermer')
    fireEvent.click(closeBtn)
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('allows switching between plans', () => {
    render(createElement(PremiumUpgradeModal, defaultProps))
    const yearlyBtn = screen.getByText('Annuel')
    fireEvent.click(yearlyBtn)
    expect(screen.getByText('-20%')).toBeDefined()
  })
})
