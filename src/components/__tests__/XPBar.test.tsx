import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  Star: (props: any) => createElement('svg', props),
  Zap: (props: any) => createElement('svg', props),
}))

// Mock AnimatedCounter
vi.mock('../ui/AnimatedCounter', () => ({
  AnimatedCounter: ({ end }: any) => createElement('span', {}, String(end)),
}))

// Mock HelpTooltip
vi.mock('../ui', () => ({
  HelpTooltip: ({ children }: any) => children,
}))

import { XPBar, LEVEL_CONFIG, getLevelInfo, getXPProgress } from '../XPBar'

describe('XPBar', () => {
  it('renders with level and XP', () => {
    render(createElement(XPBar, { currentXP: 150, level: 2 }))
    expect(screen.getByText('Régulier')).toBeDefined()
  })

  it('renders progressbar with correct aria attributes', () => {
    const { container } = render(createElement(XPBar, { currentXP: 200, level: 2 }))
    const progressbar = container.querySelector('[role="progressbar"]')
    expect(progressbar).toBeDefined()
  })

  it('renders compact mode', () => {
    const { container } = render(createElement(XPBar, { currentXP: 150, level: 2, compact: true }))
    const progressbar = container.querySelector('[role="progressbar"]')
    expect(progressbar).toBeDefined()
  })

  it('shows MAX for max level', () => {
    render(createElement(XPBar, { currentXP: 10000, level: 10, compact: true }))
    expect(screen.getByText('MAX')).toBeDefined()
  })

  it('shows MAX LEVEL badge for max level in full mode', () => {
    render(createElement(XPBar, { currentXP: 10000, level: 10 }))
    expect(screen.getByText('MAX LEVEL')).toBeDefined()
  })

  it('renders next level indicator', () => {
    render(createElement(XPBar, { currentXP: 150, level: 2 }))
    expect(screen.getByText('Prochain niveau')).toBeDefined()
    expect(screen.getByText('Vétéran')).toBeDefined()
  })

  it('does not show title when showTitle is false', () => {
    render(createElement(XPBar, { currentXP: 150, level: 2, showTitle: false }))
    expect(screen.queryByText('Régulier')).toBeNull()
  })

  it('applies custom className', () => {
    const { container } = render(createElement(XPBar, {
      currentXP: 150,
      level: 2,
      className: 'my-xp-bar',
    }))
    expect((container.firstChild as HTMLElement).className).toContain('my-xp-bar')
  })
})

describe('LEVEL_CONFIG', () => {
  it('has 10 levels', () => {
    expect(LEVEL_CONFIG).toHaveLength(10)
  })

  it('starts at level 1', () => {
    expect(LEVEL_CONFIG[0].level).toBe(1)
  })

  it('ends at level 10', () => {
    expect(LEVEL_CONFIG[9].level).toBe(10)
  })
})

describe('getLevelInfo', () => {
  it('returns correct info for level 1', () => {
    const { currentLevel } = getLevelInfo(1)
    expect(currentLevel.title).toBe('Débutant')
  })

  it('returns correct info for level 5', () => {
    const { currentLevel } = getLevelInfo(5)
    expect(currentLevel.title).toBe('Champion')
  })
})

describe('getXPProgress', () => {
  it('calculates progress correctly', () => {
    const { progress, xpInLevel, xpNeeded } = getXPProgress(150, 2)
    expect(xpInLevel).toBe(50) // 150 - 100
    expect(xpNeeded).toBe(200) // 300 - 100
    expect(progress).toBe(25) // 50/200 * 100
  })

  it('returns 100% for max level', () => {
    const { progress } = getXPProgress(15000, 10)
    expect(progress).toBe(100)
  })
})
