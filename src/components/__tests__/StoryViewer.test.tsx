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
  ChevronLeft: (props: any) => createElement('svg', props),
  ChevronRight: (props: any) => createElement('svg', props),
  Eye: (props: any) => createElement('svg', props),
}))

import { StoryViewer } from '../StoryViewer'

describe('StoryViewer', () => {
  const mockStories = [
    {
      story_id: 's1',
      user_id: 'u1',
      username: 'Alice',
      avatar_url: null,
      content_type: 'text' as const,
      content: 'Hello World',
      media_url: null,
      background_color: '#6366F1',
      text_color: '#FFFFFF',
      view_count: 5,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      story_id: 's2',
      user_id: 'u1',
      username: 'Alice',
      avatar_url: null,
      content_type: 'text' as const,
      content: 'Second Story',
      media_url: null,
      background_color: '#EF4444',
      text_color: '#FFFFFF',
      view_count: 3,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    },
  ]

  const defaultProps = {
    stories: mockStories,
    startIndex: 0,
    onClose: vi.fn(),
    onView: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders story content', () => {
    render(createElement(StoryViewer, defaultProps))
    expect(screen.getByText('Hello World')).toBeDefined()
  })

  it('renders username', () => {
    render(createElement(StoryViewer, defaultProps))
    expect(screen.getByText('Alice')).toBeDefined()
  })

  it('renders view count', () => {
    render(createElement(StoryViewer, defaultProps))
    expect(screen.getByText('5')).toBeDefined()
  })

  it('renders navigation arrows for multiple stories', () => {
    render(createElement(StoryViewer, defaultProps))
    expect(screen.getByLabelText('Suivant')).toBeDefined()
  })

  it('calls onClose when backdrop is clicked', () => {
    const { container } = render(createElement(StoryViewer, defaultProps))
    // Click on the outer fixed container
    const outer = container.firstChild as HTMLElement
    fireEvent.click(outer)
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('returns null when story is undefined', () => {
    const { container } = render(createElement(StoryViewer, {
      ...defaultProps,
      stories: [],
      startIndex: 0,
    }))
    expect(container.innerHTML).toBe('')
  })
})
