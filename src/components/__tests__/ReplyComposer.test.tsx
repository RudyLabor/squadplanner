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

// Mock icons
vi.mock('../icons', () => ({
  X: (props: any) => createElement('svg', props),
  Reply: (props: any) => createElement('svg', props),
}))

import { ReplyComposer } from '../ReplyComposer'

describe('ReplyComposer', () => {
  const mockReplyingTo = {
    id: 'msg-1',
    sender_username: 'Alice',
    content: 'This is the original message content',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when replyingTo is null', () => {
    const { container } = render(createElement(ReplyComposer, {
      replyingTo: null,
      onCancel: vi.fn(),
    }))
    expect(container.innerHTML).toBe('')
  })

  it('renders reply preview when replyingTo is set', () => {
    render(createElement(ReplyComposer, {
      replyingTo: mockReplyingTo,
      onCancel: vi.fn(),
    }))
    expect(screen.getByText('Alice')).toBeDefined()
    expect(screen.getByText('This is the original message content')).toBeDefined()
  })

  it('truncates long messages', () => {
    const longMessage = {
      ...mockReplyingTo,
      content: 'A'.repeat(100),
    }
    render(createElement(ReplyComposer, {
      replyingTo: longMessage,
      onCancel: vi.fn(),
    }))
    const truncated = screen.getByText(/\.\.\./)
    expect(truncated).toBeDefined()
  })

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(createElement(ReplyComposer, {
      replyingTo: mockReplyingTo,
      onCancel,
    }))
    fireEvent.click(screen.getByLabelText('Cancel reply'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows "Replying to" label', () => {
    render(createElement(ReplyComposer, {
      replyingTo: mockReplyingTo,
      onCancel: vi.fn(),
    }))
    expect(screen.getByText('Replying to')).toBeDefined()
  })
})
