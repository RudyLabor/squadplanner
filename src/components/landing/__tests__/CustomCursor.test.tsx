import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { createElement } from 'react'

// Hoisted mock controls
const mockUseReducedMotion = vi.hoisted(() => vi.fn().mockReturnValue(false))
const mockMotionValue = vi.hoisted(() => ({
  get: vi.fn().mockReturnValue(-100),
  set: vi.fn(),
  on: vi.fn(),
}))
const mockSpring = vi.hoisted(() => ({
  get: vi.fn().mockReturnValue(0),
  set: vi.fn(),
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  LazyMotion: ({ children }: any) => children,
  MotionConfig: ({ children }: any) => children,
  domAnimation: {},
  domMax: {},
  useInView: vi.fn().mockReturnValue(true),
  useScroll: vi.fn().mockReturnValue({ scrollYProgress: { get: () => 0 } }),
  useTransform: vi.fn().mockReturnValue(0),
  useMotionValue: vi.fn().mockReturnValue(mockMotionValue),
  useSpring: vi.fn().mockReturnValue(mockSpring),
  useAnimate: vi.fn().mockReturnValue([{ current: null }, vi.fn()]),
  useAnimation: vi.fn().mockReturnValue({ start: vi.fn(), stop: vi.fn() }),
  useReducedMotion: vi.fn().mockReturnValue(false),
  m: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, style, ...r }: any) => createElement(p, { ...r, style }, children)
          : undefined,
    }
  ),
  motion: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, style, ...r }: any) => createElement(p, { ...r, style }, children)
          : undefined,
    }
  ),
}))

vi.mock('../../../hooks/useReducedMotion', () => ({
  useReducedMotion: mockUseReducedMotion,
}))

import { CustomCursor } from '../CustomCursor'

describe('CustomCursor', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockUseReducedMotion.mockReturnValue(false)
    mockMotionValue.set.mockClear()

    // Default: non-touch device
    matchMediaMock = vi.fn().mockReturnValue({ matches: false })
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('When not supported (touch device)', () => {
    it('returns null on touch devices', () => {
      matchMediaMock.mockReturnValue({ matches: true }) // pointer: coarse = touch
      const { container } = render(<CustomCursor />)
      // Should render nothing
      expect(container.innerHTML).toBe('')
    })
  })

  describe('When not supported (reduced motion)', () => {
    it('returns null when user prefers reduced motion', () => {
      mockUseReducedMotion.mockReturnValue(true)
      const { container } = render(<CustomCursor />)
      expect(container.innerHTML).toBe('')
    })
  })

  describe('When supported (non-touch, no reduced motion)', () => {
    it('renders the cursor container', () => {
      const { container } = render(<CustomCursor />)
      const cursorDiv = container.querySelector('.fixed.inset-0')
      expect(cursorDiv).toBeInTheDocument()
    })

    it('renders trail dots (5 trail + 1 main cursor)', () => {
      const { container } = render(<CustomCursor />)
      // Trail dots are div elements with w-1.5 class (5 trails)
      // Main cursor is a div with w-4 class (1 main)
      const allChildren = container.querySelectorAll('.fixed.inset-0 > div')
      expect(allChildren.length).toBe(6) // 5 trail + 1 main
    })

    it('renders 5 trail dots', () => {
      const { container } = render(<CustomCursor />)
      const trailDots = container.querySelectorAll('.rounded-full.bg-primary-bg')
      expect(trailDots.length).toBe(5)
    })

    it('renders 1 main cursor dot', () => {
      const { container } = render(<CustomCursor />)
      const mainCursor = container.querySelector('.border-2.border-primary')
      expect(mainCursor).toBeInTheDocument()
    })

    it('starts invisible (opacity 0)', () => {
      const { container } = render(<CustomCursor />)
      const cursorDiv = container.querySelector('.fixed.inset-0')
      expect(cursorDiv).toHaveStyle({ opacity: '0' })
    })

    it('becomes visible on mousemove', () => {
      const { container } = render(<CustomCursor />)

      act(() => {
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 200 }))
      })

      const cursorDiv = container.querySelector('.fixed.inset-0')
      expect(cursorDiv).toHaveStyle({ opacity: '1' })
    })

    it('updates motion values on mousemove', () => {
      render(<CustomCursor />)

      act(() => {
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 250 }))
      })

      expect(mockMotionValue.set).toHaveBeenCalledWith(150)
      expect(mockMotionValue.set).toHaveBeenCalledWith(250)
    })

    it('hides on mouseleave', () => {
      const { container } = render(<CustomCursor />)

      // First make visible
      act(() => {
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 200 }))
      })
      expect(container.querySelector('.fixed.inset-0')).toHaveStyle({ opacity: '1' })

      // Then leave
      act(() => {
        document.dispatchEvent(new MouseEvent('mouseleave'))
      })
      expect(container.querySelector('.fixed.inset-0')).toHaveStyle({ opacity: '0' })
    })

    it('shows on mouseenter', () => {
      const { container } = render(<CustomCursor />)

      // Make visible, then hide, then show again
      act(() => {
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 200 }))
      })
      act(() => {
        document.dispatchEvent(new MouseEvent('mouseleave'))
      })
      act(() => {
        document.dispatchEvent(new MouseEvent('mouseenter'))
      })
      expect(container.querySelector('.fixed.inset-0')).toHaveStyle({ opacity: '1' })
    })

    it('has pointer-events-none on the container', () => {
      const { container } = render(<CustomCursor />)
      const cursorDiv = container.querySelector('.pointer-events-none')
      expect(cursorDiv).toBeInTheDocument()
    })

    it('has z-[9999] on the container', () => {
      const { container } = render(<CustomCursor />)
      const cursorDiv = container.querySelector('.z-\\[9999\\]')
      expect(cursorDiv).toBeInTheDocument()
    })
  })

  describe('Cleanup on unmount', () => {
    it('removes event listeners on unmount', () => {
      const removeWindowSpy = vi.spyOn(window, 'removeEventListener')
      const removeDocSpy = vi.spyOn(document, 'removeEventListener')

      const { unmount } = render(<CustomCursor />)
      unmount()

      expect(removeWindowSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(removeDocSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function))
      expect(removeDocSpy).toHaveBeenCalledWith('mouseenter', expect.any(Function))

      removeWindowSpy.mockRestore()
      removeDocSpy.mockRestore()
    })
  })
})
