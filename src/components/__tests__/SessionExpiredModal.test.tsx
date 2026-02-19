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

  // ---- P1.1 additions ----

  describe('onDismiss callback', () => {
    it('calls onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn()
      render(createElement(SessionExpiredModal, { ...defaultProps, onDismiss }))
      fireEvent.click(screen.getByText('Continuer en lecture seule'))
      expect(onDismiss).toHaveBeenCalledOnce()
    })

    it('does not render dismiss button when onDismiss is undefined', () => {
      render(createElement(SessionExpiredModal, { isOpen: true, onReconnect: vi.fn() }))
      expect(screen.queryByText('Continuer en lecture seule')).toBeNull()
    })
  })

  describe('body overflow management', () => {
    it('sets body overflow to hidden when modal opens', () => {
      document.body.style.overflow = 'auto'
      render(createElement(SessionExpiredModal, defaultProps))
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores body overflow when modal closes', () => {
      const { rerender } = render(createElement(SessionExpiredModal, defaultProps))
      expect(document.body.style.overflow).toBe('hidden')
      rerender(createElement(SessionExpiredModal, { ...defaultProps, isOpen: false }))
      expect(document.body.style.overflow).toBe('')
    })

    it('restores body overflow on unmount', () => {
      const { unmount } = render(createElement(SessionExpiredModal, defaultProps))
      expect(document.body.style.overflow).toBe('hidden')
      unmount()
      expect(document.body.style.overflow).toBe('')
    })

    it('does not set body overflow when modal is closed', () => {
      document.body.style.overflow = 'auto'
      render(createElement(SessionExpiredModal, { ...defaultProps, isOpen: false }))
      expect(document.body.style.overflow).toBe('auto')
    })
  })

  describe('focus management', () => {
    it('focuses the reconnect button when modal opens', () => {
      render(createElement(SessionExpiredModal, defaultProps))
      const reconnectButton = screen.getByText('Se reconnecter').closest('button')
      expect(document.activeElement).toBe(reconnectButton)
    })

    it('does not focus reconnect button when modal is closed', () => {
      render(createElement(SessionExpiredModal, { ...defaultProps, isOpen: false }))
      const reconnectButton = screen.queryByText('Se reconnecter')
      expect(reconnectButton).toBeNull()
    })
  })

  describe('animation presence', () => {
    it('wraps modal content in AnimatePresence', () => {
      const { container } = render(createElement(SessionExpiredModal, defaultProps))
      // AnimatePresence is mocked as pass-through, so the alertdialog should render
      expect(container.querySelector('[role="alertdialog"]')).not.toBeNull()
    })

    it('renders nothing inside AnimatePresence when closed', () => {
      const { container } = render(createElement(SessionExpiredModal, { ...defaultProps, isOpen: false }))
      expect(container.querySelector('[role="alertdialog"]')).toBeNull()
    })
  })

  describe('accessibility attributes', () => {
    it('has aria-modal set to true', () => {
      const { container } = render(createElement(SessionExpiredModal, defaultProps))
      expect(container.querySelector('[aria-modal="true"]')).not.toBeNull()
    })

    it('has aria-labelledby pointing to the title', () => {
      const { container } = render(createElement(SessionExpiredModal, defaultProps))
      const dialog = container.querySelector('[role="alertdialog"]')
      expect(dialog?.getAttribute('aria-labelledby')).toBe('session-expired-title')
    })

    it('has aria-describedby pointing to the description', () => {
      const { container } = render(createElement(SessionExpiredModal, defaultProps))
      const dialog = container.querySelector('[role="alertdialog"]')
      expect(dialog?.getAttribute('aria-describedby')).toBe('session-expired-desc')
    })
  })
})
