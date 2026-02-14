import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock framer-motion with motion values
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
  Reply: (props: any) => createElement('svg', props),
  Trash2: (props: any) => createElement('svg', props),
  MoreHorizontal: (props: any) => createElement('svg', props),
}))

// Mock hooks
vi.mock('../../hooks/useHapticFeedback', () => ({
  useHapticFeedback: vi.fn().mockReturnValue({ triggerHaptic: vi.fn() }),
}))

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn().mockReturnValue(false),
}))

// Mock motionTokens
vi.mock('../../utils/motionTokens', () => ({
  motion: {
    easing: { springSnappy: { type: 'spring', stiffness: 300, damping: 30 } },
  },
}))

import { SwipeableMessage } from '../SwipeableMessage'

describe('SwipeableMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children', () => {
    render(createElement(SwipeableMessage, {
      children: createElement('div', {}, 'Message Content'),
    }))
    expect(screen.getByText('Message Content')).toBeDefined()
  })

  it('renders children without drag when disabled', () => {
    render(createElement(SwipeableMessage, {
      disabled: true,
      children: createElement('div', {}, 'Disabled Message'),
    }))
    expect(screen.getByText('Disabled Message')).toBeDefined()
  })

  it('renders children with default settings', () => {
    render(createElement(SwipeableMessage, {
      onReply: vi.fn(),
      children: createElement('div', {}, 'Normal Message'),
    }))
    expect(screen.getByText('Normal Message')).toBeDefined()
  })

  it('renders without swipe when both directions are disabled', () => {
    render(createElement(SwipeableMessage, {
      enableSwipeLeft: false,
      enableSwipeRight: false,
      children: createElement('div', {}, 'No Swipe'),
    }))
    expect(screen.getByText('No Swipe')).toBeDefined()
  })
})
