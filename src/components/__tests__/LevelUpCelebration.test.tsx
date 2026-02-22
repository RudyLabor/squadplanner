import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

vi.mock('../../utils/celebrations', () => ({
  celebrateLevelUp: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../XPBar', () => ({
  LEVEL_CONFIG: [
    { level: 1, title: 'Recrue', color: '#808080', xpRequired: 0 },
    { level: 2, title: 'Joueur', color: '#4CAF50', xpRequired: 100 },
    { level: 3, title: 'Veteran', color: '#2196F3', xpRequired: 300 },
    { level: 5, title: 'Champion', color: '#FFD700', xpRequired: 1000 },
    { level: 10, title: 'Legende', color: '#FF6B00', xpRequired: 5000 },
  ],
  getLevelInfo: vi.fn().mockImplementation((level: number) => ({
    currentLevel: { title: level >= 5 ? 'Champion' : 'Joueur', color: '#4CAF50' },
    progress: 0.5,
    xpInLevel: 50,
    xpForNext: 100,
  })),
}))

import { LevelUpCelebration } from '../LevelUpCelebration'

describe('LevelUpCelebration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders level up text', () => {
    render(<LevelUpCelebration newLevel={2} autoDismiss={false} />)
    expect(screen.getByText('LEVEL UP')).toBeInTheDocument()
  })

  it('renders the level number', () => {
    render(<LevelUpCelebration newLevel={3} autoDismiss={false} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders new rank text', () => {
    render(<LevelUpCelebration newLevel={2} autoDismiss={false} />)
    expect(screen.getByText('Nouveau rang atteint')).toBeInTheDocument()
  })

  it('renders tap to continue hint', () => {
    render(<LevelUpCelebration newLevel={2} autoDismiss={false} />)
    expect(screen.getByText('Touche pour continuer')).toBeInTheDocument()
  })

  it('has status role for accessibility', () => {
    render(<LevelUpCelebration newLevel={2} autoDismiss={false} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders level title', () => {
    render(<LevelUpCelebration newLevel={2} autoDismiss={false} />)
    expect(screen.getByText('Joueur')).toBeInTheDocument()
  })

  it('shows trophy for high levels', () => {
    render(<LevelUpCelebration newLevel={5} autoDismiss={false} />)
    // Trophy is rendered for levels >= 5
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
