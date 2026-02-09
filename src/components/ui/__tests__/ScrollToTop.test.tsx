import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ScrollToTop } from '../ScrollToTop'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      button: ({ children, ...props }: any) => {
        const { initial, animate, exit, transition, ...rest } = props
        return <button {...rest}>{children}</button>
      },
    },
  }
})

describe('ScrollToTop', () => {
  it('renders without crash', () => {
    const { container } = render(<ScrollToTop />)
    expect(container).toBeInTheDocument()
  })

  it('is hidden by default (scrollY = 0)', () => {
    render(<ScrollToTop />)
    expect(screen.queryByLabelText('Scroll to top')).not.toBeInTheDocument()
  })

  it('shows button when scrolled past 300px', () => {
    render(<ScrollToTop />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 400, writable: true })
      window.dispatchEvent(new Event('scroll'))
    })
    expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument()
  })

  it('has correct aria-label', () => {
    render(<ScrollToTop />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 400, writable: true })
      window.dispatchEvent(new Event('scroll'))
    })
    expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument()
  })

  it('calls scrollTo when clicked', () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo as any
    render(<ScrollToTop />)
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 400, writable: true })
      window.dispatchEvent(new Event('scroll'))
    })
    screen.getByLabelText('Scroll to top').click()
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
