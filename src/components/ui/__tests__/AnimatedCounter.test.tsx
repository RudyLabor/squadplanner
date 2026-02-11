import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnimatedCounter } from '../AnimatedCounter'

vi.mock('framer-motion', () => ({
  useInView: () => false,
}))

describe('AnimatedCounter', () => {
  it('renders without crash', () => {
    const { container } = render(<AnimatedCounter end={42} />)
    expect(container).toBeInTheDocument()
  })

  it('has aria-live polite for accessibility', () => {
    const { container } = render(<AnimatedCounter end={100} />)
    const span = container.querySelector('[aria-live="polite"]')
    expect(span).toBeInTheDocument()
  })

  it('has aria-atomic true', () => {
    const { container } = render(<AnimatedCounter end={100} />)
    const span = container.querySelector('[aria-atomic="true"]')
    expect(span).toBeInTheDocument()
  })

  it('displays initial value when not in view', () => {
    render(<AnimatedCounter end={42} prefix="$" suffix="k" />)
    // When not in view, shows format(0)
    expect(screen.getByText('$0k')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<AnimatedCounter end={10} className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles singularSuffix for value <= 1', () => {
    render(<AnimatedCounter end={1} suffix=" items" singularSuffix=" item" />)
    // format(0) with value 0 <= 1, uses singularSuffix
    expect(screen.getByText('0 item')).toBeInTheDocument()
  })
})
