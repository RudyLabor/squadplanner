import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

// Polyfill CSS.supports for jsdom
if (typeof globalThis.CSS === 'undefined') {
  (globalThis as any).CSS = { supports: () => false }
} else if (typeof globalThis.CSS.supports !== 'function') {
  (globalThis.CSS as any).supports = () => false
}

// Mock framer-motion
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

// Mock icons
vi.mock('../icons', () => ({
  Lock: (props: any) => createElement('svg', props),
  Zap: (props: any) => createElement('svg', props),
  Crown: (props: any) => createElement('svg', props),
}))

// Mock ui
vi.mock('../ui', () => ({
  Button: ({ children, onClick, ...props }: any) => createElement('button', { onClick, ...props }, children),
}))

// Mock PremiumUpgradeModal
vi.mock('../PremiumUpgradeModal', () => ({
  PremiumUpgradeModal: ({ isOpen }: any) => isOpen ? createElement('div', { 'data-testid': 'premium-modal' }, 'Premium Modal') : null,
}))

const mockCanAccess = vi.fn().mockReturnValue(false)

vi.mock('../../hooks/usePremium', () => ({
  usePremiumStore: () => ({
    canAccessFeature: mockCanAccess,
  }),
}))

import { PremiumGate, PremiumBadge, SquadLimitReached } from '../PremiumGate'

describe('PremiumGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCanAccess.mockReturnValue(false)
  })

  it('renders children when user has access', () => {
    mockCanAccess.mockReturnValue(true)
    render(createElement(PremiumGate, {
      feature: 'unlimited_squads',
      children: createElement('div', {}, 'Premium Content'),
    }))
    expect(screen.getByText('Premium Content')).toBeDefined()
  })

  it('renders lock fallback when user has no access', () => {
    render(createElement(PremiumGate, {
      feature: 'unlimited_squads',
      children: createElement('div', {}, 'Premium Content'),
    }))
    expect(screen.getByText('Squads illimitées')).toBeDefined()
    expect(screen.getByText('Passe Premium pour débloquer')).toBeDefined()
  })

  it('renders nothing when fallback is hide', () => {
    const { container } = render(createElement(PremiumGate, {
      feature: 'unlimited_squads',
      fallback: 'hide',
      children: createElement('div', {}, 'Hidden'),
    }))
    expect(container.innerHTML).toBe('')
  })

  it('renders custom fallback', () => {
    render(createElement(PremiumGate, {
      feature: 'unlimited_squads',
      fallback: 'custom',
      customFallback: createElement('div', {}, 'Custom Fallback'),
      children: createElement('div', {}, 'Content'),
    }))
    expect(screen.getByText('Custom Fallback')).toBeDefined()
  })

  it('renders blur fallback', () => {
    render(createElement(PremiumGate, {
      feature: 'advanced_stats',
      fallback: 'blur',
      children: createElement('div', {}, 'Blurred Content'),
    }))
    expect(screen.getByText('Stats avancées')).toBeDefined()
    expect(screen.getByText('Premium requis')).toBeDefined()
  })

  it('renders badge only mode', () => {
    render(createElement(PremiumGate, {
      feature: 'unlimited_squads',
      showBadgeOnly: true,
      children: createElement('div', {}, 'Content with Badge'),
    }))
    expect(screen.getByText('Content with Badge')).toBeDefined()
    expect(screen.getByText('PRO')).toBeDefined()
  })
})

describe('PremiumBadge', () => {
  it('renders small badge with PRO text', () => {
    render(createElement(PremiumBadge, { small: true }))
    expect(screen.getByText('PRO')).toBeDefined()
  })

  it('renders full badge with PREMIUM text', () => {
    render(createElement(PremiumBadge, { small: false }))
    expect(screen.getByText('PREMIUM')).toBeDefined()
  })
})

describe('SquadLimitReached', () => {
  it('renders limit reached message', () => {
    const onUpgrade = vi.fn()
    render(createElement(SquadLimitReached, {
      currentCount: 3,
      maxCount: 3,
      onUpgrade,
    }))
    expect(screen.getByText('Limite atteinte')).toBeDefined()
    expect(screen.getByText(/3\/3 squads/)).toBeDefined()
  })

  it('calls onUpgrade when button clicked', () => {
    const onUpgrade = vi.fn()
    render(createElement(SquadLimitReached, {
      currentCount: 3,
      maxCount: 3,
      onUpgrade,
    }))
    const btn = screen.getByText('Passer Premium')
    fireEvent.click(btn)
    expect(onUpgrade).toHaveBeenCalled()
  })
})
