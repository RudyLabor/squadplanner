import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}))

import LazyConfetti from '../LazyConfetti'

describe('LazyConfetti', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders without crash (returns null)', () => {
    const { container } = render(<LazyConfetti />)
    expect(container.firstChild).toBeNull()
  })

  it('renders with active=false', () => {
    const { container } = render(<LazyConfetti active={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders with custom props', () => {
    const { container } = render(
      <LazyConfetti
        active={true}
        numberOfPieces={200}
        gravity={0.5}
        spread={90}
        colors={['#ff0000', '#00ff00']}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders with recycle mode', () => {
    const { container } = render(<LazyConfetti active={true} recycle={true} />)
    expect(container.firstChild).toBeNull()
  })

  it('can be imported as named export', async () => {
    const mod = await import('../LazyConfetti')
    expect(mod.LazyConfetti).toBeDefined()
    expect(mod.default).toBeDefined()
  })
})
