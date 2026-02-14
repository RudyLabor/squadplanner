import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../../../hooks/useAdaptiveLoading', () => ({
  useAdaptiveLoading: vi.fn().mockReturnValue({ tier: 'high' }),
}))

import { AdaptiveImage } from '../AdaptiveImage'

describe('AdaptiveImage', () => {
  it('renders without crash', () => {
    render(<AdaptiveImage src="/test.jpg" alt="test image" />)
    expect(screen.getByAlt('test image')).toBeInTheDocument()
  })

  it('renders with placeholder', () => {
    render(
      <AdaptiveImage
        src="/test.jpg"
        alt="test image"
        placeholder="data:image/svg+xml,placeholder"
      />
    )
    expect(screen.getByAlt('test image')).toBeInTheDocument()
  })

  it('applies className', () => {
    const { container } = render(
      <AdaptiveImage src="/test.jpg" alt="test" className="custom-class" />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
