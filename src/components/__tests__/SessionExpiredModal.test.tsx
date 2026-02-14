import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { useNavigate } from 'react-router'

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
  Clock: (props: any) => createElement('svg', props),
  Lock: (props: any) => createElement('svg', props),
  LogIn: (props: any) => createElement('svg', props),
  Eye: (props: any) => createElement('svg', props),
}))

vi.mock('react-router', () => ({
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
}))

const mockedUseNavigate = vi.mocked(useNavigate)

import { SessionExpiredModal } from '../SessionExpiredModal'

describe('SessionExpiredModal', () => {
  const mockNavigate = vi.fn()

  const defaultProps = {
    isOpen: true,
    onReconnect: vi.fn(),
    onDismiss: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    document.body.style.overflow = ''
    mockedUseNavigate.mockReturnValue(mockNavigate)
  })

  it('renders nothing when closed', () => {
    const { container } = render(createElement(SessionExpiredModal, { ...defaultProps, isOpen: false }))
    expect(container.querySelector('[role="alertdialog"]')).toBeNull()
  })

  it('renders modal when open', () => {
    render(createElement(SessionExpiredModal, defaultProps))
    expect(screen.getByText('Session expirée')).toBeDefined()
    expect(screen.getByText('Ta session a expiré. Reconnecte-toi pour continuer.')).toBeDefined()
  })

  it('calls onReconnect and navigates to /auth when reconnect clicked', () => {
    render(createElement(SessionExpiredModal, defaultProps))
    fireEvent.click(screen.getByText('Se reconnecter'))
    expect(defaultProps.onReconnect).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/auth')
  })

  it('renders dismiss button when onDismiss is provided', () => {
    render(createElement(SessionExpiredModal, defaultProps))
    expect(screen.getByText('Continuer en lecture seule')).toBeDefined()
  })

  it('calls onDismiss when dismiss button clicked', () => {
    render(createElement(SessionExpiredModal, defaultProps))
    fireEvent.click(screen.getByText('Continuer en lecture seule'))
    expect(defaultProps.onDismiss).toHaveBeenCalled()
  })

  it('uses alertdialog role for accessibility', () => {
    const { container } = render(createElement(SessionExpiredModal, defaultProps))
    expect(container.querySelector('[role="alertdialog"]')).toBeDefined()
  })

  it('locks body scroll when open', () => {
    render(createElement(SessionExpiredModal, defaultProps))
    expect(document.body.style.overflow).toBe('hidden')
  })
})
