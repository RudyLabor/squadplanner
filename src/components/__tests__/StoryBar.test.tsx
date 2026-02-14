import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  Plus: (props: any) => createElement('svg', props),
  X: (props: any) => createElement('svg', props),
}))

// Mock StoryViewer
vi.mock('../StoryViewer', () => ({
  StoryViewer: () => null,
}))

vi.mock('../../hooks/useStories', () => ({
  useStories: vi.fn().mockReturnValue({
    storyUsers: [
      {
        userId: 'user-1',
        username: 'TestUser',
        avatarUrl: null,
        hasUnviewed: true,
        isOwnStory: true,
        storyCount: 2,
      },
      {
        userId: 'user-2',
        username: 'OtherUser',
        avatarUrl: 'https://example.com/avatar.jpg',
        hasUnviewed: false,
        isOwnStory: false,
        storyCount: 1,
      },
    ],
    isLoading: false,
    createStory: vi.fn(),
    viewStory: vi.fn(),
    getUserStories: vi.fn().mockReturnValue([]),
  }),
  STORY_BACKGROUNDS: [
    { color: '#6366F1', label: 'Indigo' },
    { color: '#EF4444', label: 'Rouge' },
  ],
}))

import { StoryBar } from '../StoryBar'

describe('StoryBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders story circles for users', () => {
    render(createElement(StoryBar))
    expect(screen.getByText('Ma story')).toBeDefined()
    expect(screen.getByText('OtherUser')).toBeDefined()
  })

  it('renders story users from hook data', () => {
    render(createElement(StoryBar))
    // Verify both users are present
    expect(screen.getByText('OtherUser')).toBeDefined()
    expect(screen.getByText('Ma story')).toBeDefined()
  })
})
