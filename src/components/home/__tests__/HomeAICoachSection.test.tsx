import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) =>
    createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
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

vi.mock(
  '../../icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t, p) =>
          typeof p === 'string'
            ? (props: any) => createElement('span', { 'data-testid': `icon-${p}`, ...props })
            : undefined,
      }
    )
)
vi.mock('../../ui', () => ({
  Card: ({ children, ...props }: any) =>
    createElement('div', { 'data-testid': 'card', ...props }, children),
  SkeletonAICoach: () => createElement('div', { 'data-testid': 'skeleton-ai-coach' }),
}))

import { HomeAICoachSection } from '../HomeAICoachSection'

describe('HomeAICoachSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crash with tip', () => {
    render(
      createElement(HomeAICoachSection, {
        aiCoachTip: { tip: 'Conseil du coach', tone: 'neutral' as const },
        aiCoachLoading: false,
        onAction: vi.fn(),
      })
    )
    expect(screen.getByText('Conseil du coach')).toBeDefined()
  })

  it('shows skeleton when loading', () => {
    render(
      createElement(HomeAICoachSection, {
        aiCoachTip: undefined,
        aiCoachLoading: true,
        onAction: vi.fn(),
      })
    )
    expect(screen.getByTestId('skeleton-ai-coach')).toBeDefined()
  })

  it('returns null when no tip and not loading', () => {
    const { container } = render(
      createElement(HomeAICoachSection, {
        aiCoachTip: undefined,
        aiCoachLoading: false,
        onAction: vi.fn(),
      })
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders with celebration tone', () => {
    render(
      createElement(HomeAICoachSection, {
        aiCoachTip: { tip: 'Bravo, tu geres!', tone: 'celebration' as const },
        aiCoachLoading: false,
        onAction: vi.fn(),
      })
    )
    expect(screen.getByText('Bravo, tu geres!')).toBeDefined()
  })

  it('renders with warning tone', () => {
    render(
      createElement(HomeAICoachSection, {
        aiCoachTip: { tip: 'Attention score baisse', tone: 'warning' as const },
        aiCoachLoading: false,
        onAction: vi.fn(),
      })
    )
    expect(screen.getByText('Attention score baisse')).toBeDefined()
  })

  it('renders with encouragement tone', () => {
    render(
      createElement(HomeAICoachSection, {
        aiCoachTip: { tip: 'Continue!', tone: 'encouragement' as const },
        aiCoachLoading: false,
        onAction: vi.fn(),
      })
    )
    expect(screen.getByText('Continue!')).toBeDefined()
  })

  it('calls onAction when clicked', () => {
    const onAction = vi.fn()
    render(
      createElement(HomeAICoachSection, {
        aiCoachTip: { tip: 'Click me', tone: 'neutral' as const },
        aiCoachLoading: false,
        onAction,
      })
    )
    const tourEl = document.querySelector('[data-tour="ai-coach"]')
    if (tourEl) fireEvent.click(tourEl)
    expect(onAction).toHaveBeenCalled()
  })

  it('has data-tour attribute for guided tour', () => {
    render(
      createElement(HomeAICoachSection, {
        aiCoachTip: { tip: 'Test', tone: 'neutral' as const },
        aiCoachLoading: false,
        onAction: vi.fn(),
      })
    )
    expect(document.querySelector('[data-tour="ai-coach"]')).not.toBeNull()
  })

  it('has data-tour on skeleton too', () => {
    render(
      createElement(HomeAICoachSection, {
        aiCoachTip: undefined,
        aiCoachLoading: true,
        onAction: vi.fn(),
      })
    )
    expect(document.querySelector('[data-tour="ai-coach"]')).not.toBeNull()
  })
})
