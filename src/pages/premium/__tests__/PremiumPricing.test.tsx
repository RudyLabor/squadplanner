import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  m: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
  motion: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
}))

vi.mock('../../../components/icons', () => ({
  Check: ({ children, ...props }: any) => createElement('span', { 'data-icon': 'Check', ...props }, children),
  Gift: ({ children, ...props }: any) => createElement('span', { 'data-icon': 'Gift', ...props }, children),
  ArrowRight: ({ children, ...props }: any) => createElement('span', { 'data-icon': 'ArrowRight', ...props }, children),
  Loader2: ({ children, ...props }: any) => createElement('span', { 'data-testid': 'loader', ...props }, children),
  Rocket: ({ children, ...props }: any) => createElement('span', { 'data-icon': 'Rocket', ...props }, children),
  Sparkles: ({ children, ...props }: any) => createElement('span', { 'data-icon': 'Sparkles', ...props }, children),
  Shield: ({ children, ...props }: any) => createElement('span', { 'data-icon': 'Shield', ...props }, children),
  Clock: ({ children, ...props }: any) => createElement('span', { 'data-icon': 'Clock', ...props }, children),
  CheckCircle2: ({ children, ...props }: any) => createElement('span', { 'data-icon': 'CheckCircle2', ...props }, children),
  Crown: ({ children, ...props }: any) => createElement('span', { 'data-icon': 'Crown', ...props }, children),
  Zap: ({ children, ...props }: any) => createElement('span', { 'data-icon': 'Zap', ...props }, children),
}))

vi.mock('../../../components/ui', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) =>
    createElement('button', { onClick, disabled, ...props }, children),
  Card: ({ children, ...props }: any) => createElement('div', { 'data-testid': 'card', ...props }, children),
}))

vi.mock('../../../hooks/usePremium', () => ({
  PREMIUM_PRICE_MONTHLY: 4.99,
  PREMIUM_PRICE_YEARLY: 47.88,
}))

import { PremiumPricing } from '../PremiumPricing'

describe('PremiumPricing', () => {
  const defaultProps = {
    selectedPlan: 'monthly' as const,
    setSelectedPlan: vi.fn(),
    isLoading: false,
    error: null,
    onUpgrade: vi.fn(),
    onStartTrial: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  /* ---------------------------------------------------------------- */
  /*  Free trial banner                                                */
  /* ---------------------------------------------------------------- */
  it('renders free trial banner with "7 jours d\'essai gratuit"', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText("7 jours d'essai gratuit")).toBeDefined()
  })

  it('renders trial description text', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('Essaie Premium gratuitement pendant 7 jours')).toBeDefined()
  })

  it('renders trial trust badges', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('Aucun engagement')).toBeDefined()
    expect(screen.getByText('7 jours complets')).toBeDefined()
    expect(screen.getByText('Pas de CB requise')).toBeDefined()
  })

  it('calls onStartTrial when trial button is clicked', () => {
    render(<PremiumPricing {...defaultProps} />)
    const trialBtn = screen.getByText("Commencer l'essai gratuit")
    fireEvent.click(trialBtn.closest('button')!)
    expect(defaultProps.onStartTrial).toHaveBeenCalledTimes(1)
  })

  /* ---------------------------------------------------------------- */
  /*  Plan cards                                                       */
  /* ---------------------------------------------------------------- */
  it('renders monthly plan option with price', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('Mensuel')).toBeDefined()
    // 4.99€
    expect(screen.getByText(/4\.99/)).toBeDefined()
  })

  it('renders yearly plan option with price per month', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('Annuel')).toBeDefined()
    // 47.88/12 = 3.99
    expect(screen.getByText(/3\.99/)).toBeDefined()
  })

  it('renders "MEILLEURE OFFRE" label on yearly card', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('MEILLEURE OFFRE')).toBeDefined()
  })

  it('renders yearly total and savings', () => {
    render(<PremiumPricing {...defaultProps} />)
    // Savings: ((4.99*12 - 47.88) / (4.99*12)) * 100 = ((59.88-47.88)/59.88)*100 = 20%
    expect(screen.getByText(/20%/)).toBeDefined()
    // Yearly original price: 59.88€/an
    expect(screen.getByText(/59\.88/)).toBeDefined()
    // Yearly discounted: 47.88€/an
    expect(screen.getByText(/47\.88/)).toBeDefined()
  })

  it('renders "7j gratuits" badges on both cards', () => {
    render(<PremiumPricing {...defaultProps} />)
    const badges = screen.getAllByText('7j gratuits')
    expect(badges.length).toBe(2)
  })

  it('renders "Commence par 7 jours gratuits" on both cards', () => {
    render(<PremiumPricing {...defaultProps} />)
    const texts = screen.getAllByText('Commence par 7 jours gratuits')
    expect(texts.length).toBe(2)
  })

  /* ---------------------------------------------------------------- */
  /*  Plan selection                                                   */
  /* ---------------------------------------------------------------- */
  it('calls setSelectedPlan("monthly") when monthly card is clicked', () => {
    render(<PremiumPricing {...defaultProps} selectedPlan="yearly" />)
    fireEvent.click(screen.getByText('Mensuel').closest('button')!)
    expect(defaultProps.setSelectedPlan).toHaveBeenCalledWith('monthly')
  })

  it('calls setSelectedPlan("yearly") when yearly card is clicked', () => {
    render(<PremiumPricing {...defaultProps} selectedPlan="monthly" />)
    fireEvent.click(screen.getByText('Annuel').closest('button')!)
    expect(defaultProps.setSelectedPlan).toHaveBeenCalledWith('yearly')
  })

  it('shows checkmark on monthly card when monthly is selected', () => {
    const { container } = render(<PremiumPricing {...defaultProps} selectedPlan="monthly" />)
    // Monthly card has border-primary class and a Check icon
    const checkIcons = container.querySelectorAll('[data-icon="Check"]')
    expect(checkIcons.length).toBe(1) // only monthly selected
  })

  it('shows checkmark on yearly card when yearly is selected', () => {
    const { container } = render(<PremiumPricing {...defaultProps} selectedPlan="yearly" />)
    const checkIcons = container.querySelectorAll('[data-icon="Check"]')
    expect(checkIcons.length).toBe(1) // only yearly selected
  })

  /* ---------------------------------------------------------------- */
  /*  CTA button                                                       */
  /* ---------------------------------------------------------------- */
  it('renders "Passer Premium maintenant" CTA', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('Passer Premium maintenant')).toBeDefined()
  })

  it('calls onUpgrade when CTA button is clicked', () => {
    render(<PremiumPricing {...defaultProps} />)
    fireEvent.click(screen.getByText('Passer Premium maintenant').closest('button')!)
    expect(defaultProps.onUpgrade).toHaveBeenCalledTimes(1)
  })

  it('disables CTA button when isLoading is true', () => {
    render(<PremiumPricing {...defaultProps} isLoading={true} />)
    // When loading, the text "Passer Premium maintenant" is replaced by Loader2
    const loaders = screen.getAllByTestId('loader')
    expect(loaders.length).toBeGreaterThan(0)
  })

  it('shows loader in CTA button when loading', () => {
    render(<PremiumPricing {...defaultProps} isLoading={true} />)
    expect(screen.queryByText('Passer Premium maintenant')).toBeNull()
    expect(screen.getAllByTestId('loader').length).toBeGreaterThan(0)
  })

  /* ---------------------------------------------------------------- */
  /*  Error display                                                    */
  /* ---------------------------------------------------------------- */
  it('does NOT render error when error is null', () => {
    const { container } = render(<PremiumPricing {...defaultProps} error={null} />)
    expect(container.querySelector('.text-error')).toBeNull()
  })

  it('renders error message when error is provided', () => {
    render(<PremiumPricing {...defaultProps} error="Erreur de paiement" />)
    expect(screen.getByText('Erreur de paiement')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Trust badges at bottom of CTA                                    */
  /* ---------------------------------------------------------------- */
  it('renders payment trust badges', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('Paiement sécurisé')).toBeDefined()
    expect(screen.getByText('Annulation facile')).toBeDefined()
    expect(screen.getByText('Satisfait ou remboursé 30j')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Final CTA card                                                   */
  /* ---------------------------------------------------------------- */
  it('renders final CTA card section', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText(/Pr.t . passer Premium/)).toBeDefined()
  })

  it('calls onStartTrial from final CTA card button', () => {
    render(<PremiumPricing {...defaultProps} />)
    const trialButtons = screen.getAllByText('Essai gratuit 7 jours')
    expect(trialButtons.length).toBeGreaterThan(0)
    fireEvent.click(trialButtons[0].closest('button')!)
    expect(defaultProps.onStartTrial).toHaveBeenCalled()
  })

  it('shows loader in final CTA when loading', () => {
    render(<PremiumPricing {...defaultProps} isLoading={true} />)
    expect(screen.queryByText('Essai gratuit 7 jours')).toBeNull()
  })

  /* ---------------------------------------------------------------- */
  /*  Monthly flexibility text                                         */
  /* ---------------------------------------------------------------- */
  it('renders monthly flexibility description', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText(/Flexibilit. maximale/)).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Savings text on yearly                                           */
  /* ---------------------------------------------------------------- */
  it('renders "2 mois offerts" text on yearly card', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText(/2 mois offerts/)).toBeDefined()
  })
})
