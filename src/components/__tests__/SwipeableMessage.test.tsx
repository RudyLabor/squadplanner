import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

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

// Mock icons
vi.mock('../icons', () => ({
  Reply: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-reply' }),
  Trash2: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-trash' }),
  MoreHorizontal: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-more' }),
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

const mockedUseReducedMotion = vi.mocked(useReducedMotion)

import { SwipeableMessage } from '../SwipeableMessage'

describe('SwipeableMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseReducedMotion.mockReturnValue(false)
  })

  // STRICT: Verifies default rendering — children shown, swipe indicators present (both directions enabled by default), container structure
  it('renders children with both swipe indicators by default', () => {
    const { container } = render(
      createElement(SwipeableMessage, {
        onReply: vi.fn(),
        onActions: vi.fn(),
        children: createElement('div', { 'data-testid': 'msg' }, 'Hello World'),
      })
    )

    // 1. Children rendered
    expect(screen.getByText('Hello World')).toBeInTheDocument()
    // 2. data-testid accessible
    expect(screen.getByTestId('msg')).toBeInTheDocument()
    // 3. Reply icon is in the DOM (left swipe indicator)
    expect(screen.getByTestId('icon-reply')).toBeInTheDocument()
    // 4. Trash icon is in the DOM (right swipe indicator)
    expect(screen.getByTestId('icon-trash')).toBeInTheDocument()
    // 5. More icon is in the DOM (right swipe indicator)
    expect(screen.getByTestId('icon-more')).toBeInTheDocument()
    // 6. Container has overflow-x-hidden wrapper
    expect(container.querySelector('.overflow-x-hidden')).not.toBeNull()
    // 7. aria-hidden indicators
    const hiddenEls = container.querySelectorAll('[aria-hidden="true"]')
    expect(hiddenEls.length).toBeGreaterThanOrEqual(2)
  })

  // STRICT: Verifies disabled mode — only children rendered, no swipe indicators, no wrapper div with overflow
  it('renders only children without swipe UI when disabled', () => {
    const { container } = render(
      createElement(SwipeableMessage, {
        disabled: true,
        onReply: vi.fn(),
        onActions: vi.fn(),
        children: createElement('div', {}, 'Disabled Message'),
      })
    )

    // 1. Children rendered
    expect(screen.getByText('Disabled Message')).toBeInTheDocument()
    // 2. No reply icon (swipe UI stripped)
    expect(screen.queryByTestId('icon-reply')).not.toBeInTheDocument()
    // 3. No trash icon
    expect(screen.queryByTestId('icon-trash')).not.toBeInTheDocument()
    // 4. No more icon
    expect(screen.queryByTestId('icon-more')).not.toBeInTheDocument()
    // 5. No overflow-x-hidden wrapper
    expect(container.querySelector('.overflow-x-hidden')).toBeNull()
    // 6. No aria-hidden elements (no indicators)
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(0)
  })

  // STRICT: Verifies reduced motion mode — same as disabled, children only, no swipe gesture UI
  it('renders only children when prefers-reduced-motion is active', () => {
    mockedUseReducedMotion.mockReturnValue(true)

    const { container } = render(
      createElement(SwipeableMessage, {
        onReply: vi.fn(),
        onActions: vi.fn(),
        children: createElement('div', {}, 'Reduced Motion'),
      })
    )

    // 1. Children rendered
    expect(screen.getByText('Reduced Motion')).toBeInTheDocument()
    // 2. No swipe indicators
    expect(screen.queryByTestId('icon-reply')).not.toBeInTheDocument()
    expect(screen.queryByTestId('icon-trash')).not.toBeInTheDocument()
    expect(screen.queryByTestId('icon-more')).not.toBeInTheDocument()
    // 3. No overflow wrapper
    expect(container.querySelector('.overflow-x-hidden')).toBeNull()
    // 4. No aria-hidden elements
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(0)
    // 5. Container only contains the child
    expect(container.textContent).toBe('Reduced Motion')
    // 6. useReducedMotion was called
    expect(mockedUseReducedMotion).toHaveBeenCalled()
  })

  // STRICT: Verifies selective swipe — disabling one direction hides its indicator but keeps the other
  it('renders only left indicator when swipeRight is disabled, and vice versa', () => {
    // Only swipe left enabled
    const { container, unmount } = render(
      createElement(SwipeableMessage, {
        enableSwipeLeft: true,
        enableSwipeRight: false,
        onReply: vi.fn(),
        children: createElement('div', {}, 'Left Only'),
      })
    )

    // 1. Reply icon visible (left swipe enabled)
    expect(screen.getByTestId('icon-reply')).toBeInTheDocument()
    // 2. Trash icon NOT visible (right swipe disabled)
    expect(screen.queryByTestId('icon-trash')).not.toBeInTheDocument()
    // 3. More icon NOT visible (right swipe disabled)
    expect(screen.queryByTestId('icon-more')).not.toBeInTheDocument()
    // 4. Container has the swipe wrapper
    expect(container.querySelector('.overflow-x-hidden')).not.toBeNull()

    unmount()

    // Only swipe right enabled
    render(
      createElement(SwipeableMessage, {
        enableSwipeLeft: false,
        enableSwipeRight: true,
        onActions: vi.fn(),
        children: createElement('div', {}, 'Right Only'),
      })
    )

    // 5. Reply icon NOT visible (left swipe disabled)
    expect(screen.queryByTestId('icon-reply')).not.toBeInTheDocument()
    // 6. Trash and More icons visible (right swipe enabled)
    expect(screen.getByTestId('icon-trash')).toBeInTheDocument()
    expect(screen.getByTestId('icon-more')).toBeInTheDocument()
  })
})
