import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { StreakMilestoneToast } from '../StreakMilestoneToast'

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
        get: (_t, name) =>
          typeof name === 'string'
            ? (props: any) => createElement('svg', { 'data-testid': `icon-${name}`, ...props })
            : undefined,
      }
    )
)

vi.mock('../../LazyConfetti', () => ({
  default: () => createElement('div', { 'data-testid': 'confetti' }),
}))

vi.mock('../streakUtils', () => ({
  resolveCSSColor: () => '#ff0000',
}))

describe('StreakMilestoneToast', () => {
  it('renders nothing when milestone is null', () => {
    const { container } = render(<StreakMilestoneToast showConfetti={false} milestone={null} />)
    // No toast content
    expect(screen.queryByText('Objectif atteint')).toBeNull()
  })

  it('renders milestone toast when milestone is provided', () => {
    const milestone = { days: 7, xp: 100, label: '1 semaine', emoji: '\uD83D\uDD25' }
    render(<StreakMilestoneToast showConfetti={false} milestone={milestone} />)
    expect(screen.getByText('Objectif atteint !')).toBeDefined()
    expect(screen.getByText('Série de 7 jours !')).toBeDefined()
  })

  it('displays XP reward', () => {
    const milestone = { days: 30, xp: 500, label: '1 mois', emoji: '\uD83C\uDFC6' }
    render(<StreakMilestoneToast showConfetti={false} milestone={milestone} />)
    expect(screen.getByText(/\+500 XP gagnés/)).toBeDefined()
  })

  it('renders emoji from milestone', () => {
    const milestone = { days: 14, xp: 200, label: '2 semaines', emoji: '\uD83D\uDCAA' }
    render(<StreakMilestoneToast showConfetti={false} milestone={milestone} />)
    expect(screen.getByText('\uD83D\uDCAA')).toBeDefined()
  })

  it('renders confetti when showConfetti is true', () => {
    render(
      <StreakMilestoneToast
        showConfetti={true}
        milestone={{ days: 7, xp: 100, label: '1 semaine', emoji: '\uD83D\uDD25' }}
      />
    )
    expect(screen.getByTestId('confetti')).toBeDefined()
  })
})
