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
    createCheckoutSession: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test', error: null }),
    plans: [
      { id: 'premium_monthly', stripePriceId: 'price_monthly' },
      { id: 'premium_yearly', stripePriceId: 'price_yearly' },
    ],
  }),
}))

// Mock premium constants
vi.mock('../../hooks/usePremium', () => ({
  PREMIUM_PRICE_MONTHLY: 4.99,
  PREMIUM_PRICE_YEARLY: 47.88,
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
    const { container } = render(createElement(PremiumUpgradeModal, { ...defaultProps, isOpen: false }))
    expect(container.querySelector('[data-testid="modal"]')).toBeNull()
  })

  it('renders modal when open', () => {
    render(createElement(PremiumUpgradeModal, defaultProps))
    expect(screen.getByText('Passe Premium')).toBeDefined()
  })

  it('displays feature when provided', () => {
    render(createElement(PremiumUpgradeModal, { ...defaultProps, feature: 'Stats avancées' }))
    expect(screen.getByText(/Pour accéder à/)).toBeDefined()
  })

  it('renders plan selector with monthly and yearly options', () => {
    render(createElement(PremiumUpgradeModal, defaultProps))
    expect(screen.getByText('Mensuel')).toBeDefined()
    expect(screen.getByText('Annuel')).toBeDefined()
  })

  it('renders premium features list', () => {
    render(createElement(PremiumUpgradeModal, defaultProps))
    expect(screen.getByText('Squads illimités')).toBeDefined()
    expect(screen.getByText('Stats avancées')).toBeDefined()
    expect(screen.getByText('IA Coach avancé')).toBeDefined()
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
