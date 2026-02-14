import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

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

import { ReactionPicker, REACTION_EMOJIS } from '../ReactionPicker'

describe('ReactionPicker', () => {
  const defaultProps = {
    isOpen: true,
    onSelect: vi.fn(),
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    const { container } = render(createElement(ReactionPicker, { ...defaultProps, isOpen: false }))
    expect(container.querySelector('.fixed')).toBeNull()
  })

  it('renders all reaction emojis when open', () => {
    render(createElement(ReactionPicker, defaultProps))
    REACTION_EMOJIS.forEach(emoji => {
      expect(screen.getByLabelText(`React with ${emoji}`)).toBeDefined()
    })
  })

  it('calls onSelect and onClose when an emoji is clicked', () => {
    render(createElement(ReactionPicker, defaultProps))
    const thumbsUp = screen.getByLabelText('React with 👍')
    fireEvent.click(thumbsUp)
    expect(defaultProps.onSelect).toHaveBeenCalledWith('👍')
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onClose when backdrop is clicked', () => {
    const { container } = render(createElement(ReactionPicker, defaultProps))
    const backdrop = container.querySelector('.fixed.inset-0')
    if (backdrop) fireEvent.click(backdrop)
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('exports REACTION_EMOJIS with correct count', () => {
    expect(REACTION_EMOJIS).toHaveLength(6)
  })
})
