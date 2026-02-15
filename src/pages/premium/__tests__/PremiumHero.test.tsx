import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
  Button: ({ children, onClick, disabled, variant, ...props }: any) => createElement('button', { onClick, disabled, 'data-variant': variant, ...props }, children),
}))

vi.mock('../../../components/LazyConfetti', () => ({
  __esModule: true,
  default: () => null,
}))

vi.mock('../../../components/layout/MobilePageHeader', () => ({
  MobilePageHeader: ({ title }: any) => createElement('div', { 'data-testid': 'mobile-header' }, title),
}))

import { PremiumHero } from '../PremiumHero'

describe('PremiumHero', () => {
  // STRICT: verifies non-premium state — title, subtitle, promo badge, no premium status, no manage button
  it('renders hero for non-premium user with title, description, and promo badge', () => {
    render(<PremiumHero hasPremium={false} isLoading={false} onManageSubscription={vi.fn()} />)

    // 1. "Premium" in mobile header
    expect(screen.getByTestId('mobile-header')).toBeDefined()
    expect(screen.getByText('Premium')).toBeDefined()
    // 2. Main heading
    expect(screen.getByText(/Passe au niveau/)).toBeDefined()
    // 3. Subtitle about unlocking features
    expect(screen.getByText(/potentiel de Squad Planner/)).toBeDefined()
    // 4. Promo badge "2 mois offerts sur l'annuel"
    expect(screen.getByText(/2 mois offerts/)).toBeDefined()
    // 5. No premium status shown
    expect(screen.queryByText(/Tu es d/)).toBeNull()
    // 6. No manage subscription button
    expect(screen.queryByText(/abonnement/)).toBeNull()
  })

  // STRICT: verifies premium state — premium status badge, manage subscription button, title still shown
  it('renders premium status badge and manage subscription button for premium user', () => {
    const onManage = vi.fn()
    render(<PremiumHero hasPremium={true} isLoading={false} onManageSubscription={onManage} />)

    // 1. Premium status message
    expect(screen.getByText(/Tu es d/)).toBeDefined()
    // 2. Manage subscription button
    expect(screen.getByText(/abonnement/)).toBeDefined()
    // 3. Title still shown
    expect(screen.getByText(/Passe au niveau/)).toBeDefined()
    // 4. Promo badge still shown
    expect(screen.getByText(/2 mois offerts/)).toBeDefined()
    // 5. Button is enabled (not loading)
    const manageBtn = screen.getByText(/abonnement/).closest('button')
    expect(manageBtn?.disabled).toBe(false)
    // 6. Clicking manage calls onManageSubscription
    fireEvent.click(manageBtn!)
    expect(onManage).toHaveBeenCalledTimes(1)
  })

  // STRICT: verifies loading state — manage button disabled when isLoading
  it('disables manage button when isLoading is true', () => {
    render(<PremiumHero hasPremium={true} isLoading={true} onManageSubscription={vi.fn()} />)

    // 1. Premium status shown
    expect(screen.getByText(/Tu es d/)).toBeDefined()
    // 2. Manage button present
    const buttons = screen.getAllByRole('button')
    const manageBtn = buttons.find(b => b.closest('[data-variant="secondary"]'))
    // 3. Button is disabled when loading
    expect(manageBtn?.disabled).toBe(true)
    // 4. Title still rendered
    expect(screen.getByText(/Passe au niveau/)).toBeDefined()
    // 5. Description still rendered
    expect(screen.getByText(/potentiel de Squad Planner/)).toBeDefined()
    // 6. Mobile header still present
    expect(screen.getByTestId('mobile-header')).toBeDefined()
  })
})
