import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { toast, ToastContainer } from '../Toast'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useMotionValue: () => ({ get: () => 0, set: vi.fn(), onChange: vi.fn() }),
    useTransform: () => ({ get: () => 1 }),
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => {
        const {
          initial,
          animate: a,
          exit,
          transition,
          layout,
          style: mStyle,
          drag,
          dragConstraints,
          dragElastic,
          onDragEnd,
          ...rest
        } = props
        return (
          <div style={mStyle} {...rest}>
            {children}
          </div>
        )
      },
    },
    m: {
      ...actual.m,
      div: ({ children, ...props }: any) => {
        const {
          initial,
          animate: a,
          exit,
          transition,
          layout,
          style: mStyle,
          drag,
          dragConstraints,
          dragElastic,
          onDragEnd,
          ...rest
        } = props
        return (
          <div style={mStyle} {...rest}>
            {children}
          </div>
        )
      },
    },
  }
})

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
