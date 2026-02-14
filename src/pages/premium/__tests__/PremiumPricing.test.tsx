import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  LazyMotion: ({ children }: any) => children,
  MotionConfig: ({ children }: any) => children,
  domAnimation: {},
  domMax: {},
  useInView: vi.fn().mockReturnValue(true),
  useScroll: vi.fn().mockReturnValue({ scrollYProgress: { get: () => 0 } }),
  useTransform: vi.fn().mockReturnValue(0),
  useMotionValue: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn(), on: vi.fn() }),
  useSpring: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn() }),
  useAnimate: vi.fn().mockReturnValue([{ current: null }, vi.fn()]),
  useAnimation: vi.fn().mockReturnValue({ start: vi.fn(), stop: vi.fn() }),
  useReducedMotion: vi.fn().mockReturnValue(false),
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

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

vi.mock('../../../components/ui', () => ({
  Button: ({ children, ...props }: any) => createElement('button', props, children),
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

vi.mock('../../../hooks/usePremium', () => ({
  PREMIUM_PRICE_MONTHLY: 4.99,
  PREMIUM_PRICE_YEARLY: 49.99,
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

  it('renders without crashing', () => {
    const { container } = render(<PremiumPricing {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('renders free trial section', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText("7 jours d'essai gratuit")).toBeTruthy()
  })

  it('renders monthly plan option', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('Mensuel')).toBeTruthy()
  })

  it('renders yearly plan option', () => {
    render(<PremiumPricing {...defaultProps} />)
    expect(screen.getByText('Annuel')).toBeTruthy()
  })

  it('renders error when provided', () => {
    render(<PremiumPricing {...defaultProps} error="Erreur de paiement" />)
    expect(screen.getByText('Erreur de paiement')).toBeTruthy()
  })
})
