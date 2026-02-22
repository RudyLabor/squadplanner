import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { toast, ToastContainer } from '../Toast'
import { createElement } from 'react'

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

describe('toast API', () => {
  beforeEach(() => {
    toast.dismiss()
  })

  it('creates success toast', () => {
    const id = toast.success('Done!')
    expect(id).toBeTruthy()
  })

  it('creates error toast', () => {
    const id = toast.error('Failed!')
    expect(id).toBeTruthy()
  })

  it('creates warning toast', () => {
    const id = toast.warning('Watch out!')
    expect(id).toBeTruthy()
  })

  it('creates info toast', () => {
    const id = toast.info('FYI')
    expect(id).toBeTruthy()
  })

  it('creates generic toast', () => {
    const id = toast.show('Hello')
    expect(id).toBeTruthy()
  })

  it('dismisses specific toast', () => {
    const id = toast.success('Test')
    toast.dismiss(id)
    // No error thrown
  })

  it('dismisses all toasts', () => {
    toast.success('A')
    toast.success('B')
    toast.dismiss()
    // No error thrown
  })
})

describe('ToastContainer', () => {
  beforeEach(() => {
    toast.dismiss()
  })

  it('renders container with aria-label', () => {
    render(<ToastContainer />)
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
  })

  it('displays toast messages', () => {
    render(<ToastContainer />)
    act(() => {
      toast.success('Task completed')
    })
    expect(screen.getByText('Task completed')).toBeInTheDocument()
  })

  it('toasts have role=alert', () => {
    render(<ToastContainer />)
    act(() => {
      toast.error('Error occurred')
    })
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders close button', () => {
    render(<ToastContainer />)
    act(() => {
      toast.success('Closable')
    })
    expect(screen.getByLabelText('Fermer la notification')).toBeInTheDocument()
  })
})
