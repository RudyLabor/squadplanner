import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/premium', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) =>
    createElement('a', { href: to, ...props }, children),
}))

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
  m: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
  motion: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
}))

vi.mock('../../../components/icons', () => ({
  Crown: (p: any) => createElement('span', { ...p, 'data-icon': 'Crown' }),
  Check: (p: any) => createElement('span', { ...p, 'data-icon': 'Check' }),
  X: (p: any) => createElement('span', { ...p, 'data-icon': 'X' }),
  Gift: (p: any) => createElement('span', { ...p, 'data-icon': 'Gift' }),
  ArrowRight: (p: any) => createElement('span', { ...p, 'data-icon': 'ArrowRight' }),
  Loader2: ({ children, ...p }: any) =>
    createElement('span', { 'data-testid': 'loader', ...p }, children),
  Rocket: (p: any) => createElement('span', { ...p, 'data-icon': 'Rocket' }),
  Sparkles: (p: any) => createElement('span', { ...p, 'data-icon': 'Sparkles' }),
  Shield: (p: any) => createElement('span', { ...p, 'data-icon': 'Shield' }),
  Clock: (p: any) => createElement('span', { ...p, 'data-icon': 'Clock' }),
  CheckCircle2: (p: any) => createElement('span', { ...p, 'data-icon': 'CheckCircle2' }),
  Zap: (p: any) => createElement('span', { ...p, 'data-icon': 'Zap' }),
  ChevronDown: (p: any) => createElement('span', { ...p, 'data-icon': 'ChevronDown' }),
  ChevronUp: (p: any) => createElement('span', { ...p, 'data-icon': 'ChevronUp' }),
  ChevronLeft: (p: any) => createElement('span', { ...p, 'data-icon': 'ChevronLeft' }),
  ChevronRight: (p: any) => createElement('span', { ...p, 'data-icon': 'ChevronRight' }),
  Users: (p: any) => createElement('span', { ...p, 'data-icon': 'Users' }),
  Calendar: (p: any) => createElement('span', { ...p, 'data-icon': 'Calendar' }),
  BarChart3: (p: any) => createElement('span', { ...p, 'data-icon': 'BarChart3' }),
  Mic2: (p: any) => createElement('span', { ...p, 'data-icon': 'Mic2' }),
  Star: (p: any) => createElement('span', { ...p, 'data-icon': 'Star' }),
}))

vi.mock('../../../components/ui', () => ({
  Button: ({ children, onClick, disabled, variant, ...props }: any) =>
    createElement('button', { onClick, disabled, 'data-variant': variant, ...props }, children),
}))

vi.mock('../../../components/LazyConfetti', () => ({
  __esModule: true,
  default: () => null,
}))

vi.mock('../../../components/layout/MobilePageHeader', () => ({
  MobilePageHeader: ({ title }: any) =>
    createElement('div', { 'data-testid': 'mobile-header' }, title),
}))

import { PremiumHero } from '../PremiumHero'

describe('PremiumHero', () => {
  // STRICT: verifies non-premium state — title, subtitle, promo badge, no premium status, no manage button
  it('renders hero for non-premium user with title, description, and promo badge', () => {
    render(<PremiumHero hasPremium={false} isLoading={false} onManageSubscription={vi.fn()} />)

    // 1. "Premium" text in header area
    expect(screen.getByText('Premium')).toBeDefined()
    // 2. Main heading
    expect(screen.getByText(/Passe au niveau/)).toBeDefined()
    // 3. Subtitle about serious squads
    expect(screen.getByText(/Les squads sérieuses méritent des outils sérieux/)).toBeDefined()
    // 4. Promo badge "2 mois offerts — économise 16,78 €"
    expect(screen.getByText(/2 mois offerts — économise 16,78/)).toBeDefined()
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
    expect(screen.getByText(/2 mois offerts — économise 16,78/)).toBeDefined()
    // 5. Button is enabled (not loading)
    const manageBtn = screen.getByText(/abonnement/)
    const btn = manageBtn.closest('button') || manageBtn
    expect((btn as HTMLButtonElement).disabled).toBeFalsy()
    // 6. Clicking manage calls onManageSubscription
    fireEvent.click(btn!)
    expect(onManage).toHaveBeenCalledTimes(1)
  })

  // STRICT: verifies loading state — manage button disabled when isLoading
  it('disables manage button when isLoading is true', () => {
    render(<PremiumHero hasPremium={true} isLoading={true} onManageSubscription={vi.fn()} />)

    // 1. Premium status shown
    expect(screen.getByText(/Tu es d/)).toBeDefined()
    // 2. A disabled button is present (manage button disabled when loading)
    const buttons = screen.getAllByRole('button')
    const disabledBtn = buttons.find((b) => b.hasAttribute('disabled'))
    // 3. Button is disabled when loading
    expect(disabledBtn).toBeDefined()
    // 4. Title still rendered
    expect(screen.getByText(/Passe au niveau/)).toBeDefined()
    // 5. Description still rendered
    expect(screen.getByText(/Les squads sérieuses méritent des outils sérieux/)).toBeDefined()
    // 6. "Premium" header text still present
    expect(screen.getByText('Premium')).toBeDefined()
  })
})
