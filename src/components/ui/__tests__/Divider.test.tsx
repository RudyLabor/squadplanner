import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Divider } from '../Divider'

describe('Divider', () => {
  it('renders horizontal divider by default', () => {
    render(<Divider />)
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('renders with role=separator', () => {
    render(<Divider />)
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal')
  })

  it('renders vertical divider', () => {
    render(<Divider orientation="vertical" />)
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical')
  })

  it('renders label text', () => {
    render(<Divider label="or" />)
    expect(screen.getByText('or')).toBeInTheDocument()
  })

  it('renders label with separator role', () => {
    render(<Divider label="or" />)
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('applies variant classes', () => {
    const { container } = render(<Divider variant="strong" />)
    expect(container.querySelector('.border-border-hover')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Divider className="my-divider" />)
    expect(container.querySelector('.my-divider')).toBeInTheDocument()
  })
})
