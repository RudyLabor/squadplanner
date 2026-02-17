import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
  PREMIUM_PRICE_MONTHLY: 6.99,
  PREMIUM_PRICE_YEARLY: 59.88,
  SQUAD_LEADER_PRICE_MONTHLY: 14.99,
  SQUAD_LEADER_PRICE_YEARLY: 143.88,
  CLUB_PRICE_MONTHLY: 39.99,
  CLUB_PRICE_YEARLY: 383.88,
}))

import { PremiumPricing } from '../PremiumPricing'

describe('PremiumPricing', () => {
  const defaultProps = {
    isLoading: false,
    error: null,
    onUpgrade: vi.fn(),
    onStartTrial: vi.fn(),
  }

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
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
  /*  Launch promo banner                                              */
  /* ---------------------------------------------------------------- */
  it('renders launch promo banner with discount code', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('Offre de lancement -30%')).toBeDefined()
    expect(screen.getByText('LAUNCH30')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Monthly / Yearly toggle                                          */
  /* ---------------------------------------------------------------- */
  it('renders monthly/yearly toggle', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('Mensuel')).toBeDefined()
    expect(screen.getByText(/Annuel/)).toBeDefined()
  })

  it('renders -20% badge on yearly toggle', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('-20%')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  3 Tier cards                                                     */
  /* ---------------------------------------------------------------- */
  it('renders all 3 tier names: Premium, Squad Leader, Club', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('Premium')).toBeDefined()
    expect(screen.getByText('Squad Leader')).toBeDefined()
    expect(screen.getByText('Club')).toBeDefined()
  })

  it('renders tier descriptions', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('Pour les joueurs réguliers.')).toBeDefined()
    expect(screen.getByText('Pour les capitaines de squad.')).toBeDefined()
    expect(screen.getByText('Pour les structures esport.')).toBeDefined()
  })

  it('renders monthly prices for all 3 tiers', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText(/6\.99/)).toBeDefined()
    expect(screen.getByText(/14\.99/)).toBeDefined()
    expect(screen.getByText(/39\.99/)).toBeDefined()
  })

  it('renders POPULAIRE badge on Squad Leader tier', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('POPULAIRE')).toBeDefined()
  })

  it('renders B2B badge on Club tier', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('B2B')).toBeDefined()
  })

  it('renders CTA button for each tier', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('Choisir Premium')).toBeDefined()
    expect(screen.getByText('Choisir Squad Leader')).toBeDefined()
    expect(screen.getByText('Contacter')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Tier features                                                    */
  /* ---------------------------------------------------------------- */
  it('renders Premium tier features', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('5 squads')).toBeDefined()
    expect(screen.getByText('Sessions illimitées')).toBeDefined()
    expect(screen.getByText('Zéro pub')).toBeDefined()
  })

  it('renders Squad Leader tier features', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('Tout Premium inclus')).toBeDefined()
    expect(screen.getByText('Squads illimités')).toBeDefined()
    expect(screen.getByText('Sessions récurrentes')).toBeDefined()
  })

  it('renders Club tier features', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('Tout Squad Leader inclus')).toBeDefined()
    expect(screen.getByText('Dashboard multi-squads')).toBeDefined()
    expect(screen.getByText('API webhooks')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Yearly toggle and pricing                                        */
  /* ---------------------------------------------------------------- */
  it('shows yearly per-month prices after clicking Annuel toggle', () => {
    render(<PremiumPricing {...defaultProps} />)
    fireEvent.click(screen.getByText(/Annuel/))
    // Premium: 59.88/12 = 4.99, Squad Leader: 143.88/12 = 11.99, Club: 383.88/12 = 31.99
    expect(screen.getByText(/4\.99/)).toBeDefined()
    expect(screen.getByText(/11\.99/)).toBeDefined()
    expect(screen.getByText(/31\.99/)).toBeDefined()
  })

  it('shows yearly totals and savings percentage in yearly mode', () => {
    render(<PremiumPricing {...defaultProps} />)
    fireEvent.click(screen.getByText(/Annuel/))
    expect(screen.getByText(/59\.88/)).toBeDefined()
    expect(screen.getByText(/143\.88/)).toBeDefined()
    expect(screen.getByText(/383\.88/)).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  onUpgrade calls                                                  */
  /* ---------------------------------------------------------------- */
  it('calls onUpgrade(premium, monthly) when Choisir Premium is clicked', () => {
    render(<PremiumPricing {...defaultProps} />)
    fireEvent.click(screen.getByText('Choisir Premium').closest('button')!)
    expect(defaultProps.onUpgrade).toHaveBeenCalledWith('premium', 'monthly')
  })

  it('calls onUpgrade(squad_leader, yearly) after toggling to yearly', () => {
    render(<PremiumPricing {...defaultProps} />)
    fireEvent.click(screen.getByText(/Annuel/))
    fireEvent.click(screen.getByText('Choisir Squad Leader').closest('button')!)
    expect(defaultProps.onUpgrade).toHaveBeenCalledWith('squad_leader', 'yearly')
  })

  it('calls onUpgrade(club, monthly) when Contacter is clicked', () => {
    render(<PremiumPricing {...defaultProps} />)
    fireEvent.click(screen.getByText('Contacter').closest('button')!)
    expect(defaultProps.onUpgrade).toHaveBeenCalledWith('club', 'monthly')
  })

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */
  it('shows loaders in tier buttons when isLoading is true', () => {
    render(<PremiumPricing {...defaultProps} isLoading={true} />)
    const loaders = screen.getAllByTestId('loader')
    expect(loaders.length).toBeGreaterThan(0)
  })

  it('hides tier CTA labels when loading', () => {
    render(<PremiumPricing {...defaultProps} isLoading={true} />)
    expect(screen.queryByText('Choisir Premium')).toBeNull()
    expect(screen.queryByText('Choisir Squad Leader')).toBeNull()
    expect(screen.queryByText('Contacter')).toBeNull()
  })

  it('hides final CTA text when loading', () => {
    render(<PremiumPricing {...defaultProps} isLoading={true} />)
    expect(screen.queryByText('Essai gratuit 7 jours')).toBeNull()
  })

  /* ---------------------------------------------------------------- */
  /*  Error display                                                    */
  /* ---------------------------------------------------------------- */
  it('does NOT render error when error is null', () => {
    render(<PremiumPricing {...defaultProps} error={null} />)
    expect(screen.queryByText('Erreur de paiement')).toBeNull()
  })

  it('renders error message when error is provided', () => {
    render(<PremiumPricing {...defaultProps} error="Erreur de paiement" />)
    expect(screen.getByText('Erreur de paiement')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Trust badges                                                     */
  /* ---------------------------------------------------------------- */
  it('renders payment trust badges', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('Paiement sécurisé Stripe')).toBeDefined()
    expect(screen.getByText('Annulation facile')).toBeDefined()
    expect(screen.getByText('Satisfait ou remboursé 30j')).toBeDefined()
  })

  /* ---------------------------------------------------------------- */
  /*  Final CTA card                                                   */
  /* ---------------------------------------------------------------- */
  it('renders final CTA card section', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText(/Pr.t . passer au niveau sup.rieur/)).toBeDefined()
  })

  it('calls onStartTrial from final CTA card button', () => {
    render(<PremiumPricing {...defaultProps} />)
    const trialButtons = screen.getAllByText('Essai gratuit 7 jours')
    expect(trialButtons.length).toBeGreaterThan(0)
    fireEvent.click(trialButtons[0].closest('button')!)
    expect(defaultProps.onStartTrial).toHaveBeenCalled()
  })
})
