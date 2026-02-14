import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { CallAvatar } from '../CallAvatar'

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
vi.mock('../../icons', () => ({
  Phone: (props: any) => createElement('svg', { 'data-testid': 'icon-phone', ...props }),
}))

describe('CallAvatar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <CallAvatar status="calling" initial="T" />
    )
    expect(container.firstChild).toBeTruthy()
  })

  it('displays the initial when no avatar URL is provided', () => {
    render(<CallAvatar status="calling" initial="T" />)
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('displays avatar image when avatarUrl is provided', () => {
    render(
      <CallAvatar
        status="connected"
        avatarUrl="https://example.com/avatar.png"
        username="TestUser"
        initial="T"
      />
    )
    const img = screen.getByAltText('TestUser')
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png')
  })

  it('shows connected indicator when status is connected', () => {
    render(<CallAvatar status="connected" initial="T" />)
    expect(screen.getByTestId('icon-phone')).toBeInTheDocument()
  })

  it('does not show connected indicator when status is calling', () => {
    render(<CallAvatar status="calling" initial="T" />)
    expect(screen.queryByTestId('icon-phone')).not.toBeInTheDocument()
  })

  it('does not show connected indicator for idle status', () => {
    render(<CallAvatar status="idle" initial="T" />)
    expect(screen.queryByTestId('icon-phone')).not.toBeInTheDocument()
  })

  it('renders with custom username for alt text', () => {
    render(
      <CallAvatar
        status="connected"
        avatarUrl="https://example.com/avatar.png"
        username="GamerPro"
        initial="G"
      />
    )
    expect(screen.getByAltText('GamerPro')).toBeInTheDocument()
  })
})
