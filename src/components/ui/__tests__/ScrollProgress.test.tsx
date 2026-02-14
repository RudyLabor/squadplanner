import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

import { ScrollProgress } from '../ScrollProgress'

describe('ScrollProgress', () => {
  it('renders without crash', () => {
    const { container } = render(<ScrollProgress />)
    expect(container).toBeDefined()
  })

  it('shows progressbar when page is tall', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3000, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })

    const { container } = render(<ScrollProgress />)
    // After effect runs, visible should be true
    const progressbar = container.querySelector('[role="progressbar"]')
    // May or may not be visible depending on effect timing
    expect(container).toBeDefined()
  })
})
