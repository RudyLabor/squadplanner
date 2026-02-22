import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { ChallengeCard } from '../ChallengeCard'

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

vi.mock('../../ui', () => ({
  Button: ({ children, onClick, ...props }: any) =>
    createElement('button', { onClick, ...props }, children),
  Card: ({ children, className }: any) =>
    createElement('div', { className, 'data-testid': 'card' }, children),
}))

describe('ChallengeCard', () => {
  const baseChallenge = {
    id: 'c1',
    title: 'Win 5 games',
    description: 'Win five games in a row',
    xp_reward: 100,
    type: 'daily' as const,
    icon: 'star',
    requirements: { type: 'wins', count: 5 },
  }

  it('renders challenge title and description', () => {
    render(
      <ChallengeCard challenge={baseChallenge} index={0} onClaim={vi.fn()} isClaiming={false} />
    )
    expect(screen.getByText('Win 5 games')).toBeDefined()
    expect(screen.getByText('Win five games in a row')).toBeDefined()
  })

  it('renders XP reward', () => {
    render(
      <ChallengeCard challenge={baseChallenge} index={0} onClaim={vi.fn()} isClaiming={false} />
    )
    expect(screen.getByText('100 XP')).toBeDefined()
  })

  it('renders type label', () => {
    render(
      <ChallengeCard challenge={baseChallenge} index={0} onClaim={vi.fn()} isClaiming={false} />
    )
    expect(screen.getByText('Quotidien')).toBeDefined()
  })

  it('shows progress bar when not claimed', () => {
    const challengeWithProgress = {
      ...baseChallenge,
      userProgress: {
        challenge_id: 'c1',
        progress: 3,
        target: 5,
        completed_at: null,
        xp_claimed: false,
      },
    }
    render(
      <ChallengeCard
        challenge={challengeWithProgress}
        index={0}
        onClaim={vi.fn()}
        isClaiming={false}
      />
    )
    expect(screen.getByText('3/5')).toBeDefined()
  })

  it('shows claim button when completed but not claimed', () => {
    const completedChallenge = {
      ...baseChallenge,
      userProgress: {
        challenge_id: 'c1',
        progress: 5,
        target: 5,
        completed_at: '2026-01-01',
        xp_claimed: false,
      },
    }
    render(
      <ChallengeCard
        challenge={completedChallenge}
        index={0}
        onClaim={vi.fn()}
        isClaiming={false}
      />
    )
    expect(screen.getByText(/Réclamer 100 XP/)).toBeDefined()
  })

  it('shows claimed state when XP is claimed', () => {
    const claimedChallenge = {
      ...baseChallenge,
      userProgress: {
        challenge_id: 'c1',
        progress: 5,
        target: 5,
        completed_at: '2026-01-01',
        xp_claimed: true,
      },
    }
    render(
      <ChallengeCard challenge={claimedChallenge} index={0} onClaim={vi.fn()} isClaiming={false} />
    )
    expect(screen.getByText('XP réclamés')).toBeDefined()
  })
})
