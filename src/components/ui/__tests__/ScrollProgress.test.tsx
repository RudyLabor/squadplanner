import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

import { ScrollProgress } from '../ScrollProgress'

describe('ScrollProgress', () => {
  const originalScrollHeight = Object.getOwnPropertyDescriptor(document.documentElement, 'scrollHeight')
  const originalInnerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight')

  beforeEach(() => {
    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(0)
      return 0
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Restore original descriptors
    if (originalScrollHeight) {
      Object.defineProperty(document.documentElement, 'scrollHeight', originalScrollHeight)
    }
    if (originalInnerHeight) {
      Object.defineProperty(window, 'innerHeight', originalInnerHeight)
    }
  })

  // STRICT: short page (< 2x viewport) renders nothing, no progressbar role
  it('renders nothing when page is shorter than 2x viewport', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 800, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })

    const { container } = render(<ScrollProgress />)

    expect(container.innerHTML).toBe('')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(container.querySelector('.fixed')).not.toBeInTheDocument()
  })

  // STRICT: tall page (> 2x viewport) shows progressbar with correct ARIA attributes, structure, styles
  it('shows progressbar with correct attributes on tall pages', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3000, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })

    const { container } = render(<ScrollProgress />)

    // Progressbar role present
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toBeInTheDocument()

    // Correct aria-label
    expect(progressbar).toHaveAttribute('aria-label', 'Scroll progress')

    // Fixed position, pointer-events-none, z-index
    expect(progressbar).toHaveClass('fixed')
    expect(progressbar).toHaveClass('top-0')
    expect(progressbar).toHaveClass('pointer-events-none')

    // Inner bar exists with transform scaleX(0) initially
    const innerBar = container.querySelector('.origin-left')
    expect(innerBar).toBeInTheDocument()
    expect(innerBar).toHaveClass('will-change-transform')
    expect(innerBar).toHaveStyle({ transform: 'scaleX(0)' })

    // Inner bar uses CSS custom property for color
    expect(innerBar).toHaveStyle({ backgroundColor: 'var(--color-primary, #6366f1)' })
  })

  // STRICT: cleans up event listeners on unmount without errors
  it('unmounts cleanly without errors', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3000, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })

    const { unmount } = render(<ScrollProgress />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(() => unmount()).not.toThrow()
  })
})
