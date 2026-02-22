import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { CommandPreviewPanel } from '../CommandPreviewPanel'

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

const MockIcon = (props: any) => createElement('svg', { 'data-testid': 'mock-icon', ...props })

describe('CommandPreviewPanel', () => {
  it('renders nothing when command is undefined', () => {
    const { container } = render(<CommandPreviewPanel command={undefined} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when command has no preview', () => {
    const command = {
      id: 'test',
      label: 'Test',
      icon: MockIcon,
      action: vi.fn(),
      category: 'navigation' as const,
    }
    const { container } = render(<CommandPreviewPanel command={command} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders preview panel when command has preview', () => {
    const command = {
      id: 'squad-1',
      label: 'My Squad',
      description: 'A test squad',
      icon: MockIcon,
      action: vi.fn(),
      category: 'squads' as const,
      preview: {
        type: 'squad' as const,
        data: { name: 'My Squad', game: 'Valorant' },
      },
    }
    render(<CommandPreviewPanel command={command} />)
    expect(screen.getByText('My Squad')).toBeDefined()
    expect(screen.getByText('Valorant')).toBeDefined()
  })

  it('renders description when present', () => {
    const command = {
      id: 'nav-1',
      label: 'Home',
      description: 'Go to home page',
      icon: MockIcon,
      action: vi.fn(),
      category: 'navigation' as const,
      preview: { type: 'navigation' as const },
    }
    render(<CommandPreviewPanel command={command} />)
    expect(screen.getByText('Go to home page')).toBeDefined()
  })

  it('renders children actions list', () => {
    const command = {
      id: 'squad-1',
      label: 'My Squad',
      icon: MockIcon,
      action: vi.fn(),
      category: 'squads' as const,
      preview: { type: 'squad' as const },
      children: [
        {
          id: 'child-1',
          label: 'Open',
          icon: MockIcon,
          action: vi.fn(),
          category: 'squads' as const,
        },
        {
          id: 'child-2',
          label: 'Chat',
          icon: MockIcon,
          action: vi.fn(),
          category: 'squads' as const,
        },
      ],
    }
    render(<CommandPreviewPanel command={command} />)
    expect(screen.getByText('Actions')).toBeDefined()
    expect(screen.getByText('Open')).toBeDefined()
    expect(screen.getByText('Chat')).toBeDefined()
  })
})
