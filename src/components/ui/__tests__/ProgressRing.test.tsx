import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressRing } from '../ProgressRing'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    useInView: () => true,
    motion: {
      ...actual.motion,
      circle: (props: any) => {
        const { initial, animate, transition, ...rest } = props
        return <circle {...rest} />
      },
    },
  }
})

describe('ProgressRing', () => {
  it('renders with role=progressbar', () => {
    render(<ProgressRing value={75} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('sets aria-valuenow', () => {
    render(<ProgressRing value={75} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75')
  })

  it('sets aria-valuemin and aria-valuemax', () => {
    render(<ProgressRing value={50} />)
    const ring = screen.getByRole('progressbar')
    expect(ring).toHaveAttribute('aria-valuemin', '0')
    expect(ring).toHaveAttribute('aria-valuemax', '100')
  })

  it('clamps value to 0-100', () => {
    render(<ProgressRing value={150} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('shows percentage text by default', () => {
    render(<ProgressRing value={42} />)
    expect(screen.getByText('42%')).toBeInTheDocument()
  })

  it('hides percentage when showValue=false', () => {
    render(<ProgressRing value={42} showValue={false} />)
    expect(screen.queryByText('42%')).not.toBeInTheDocument()
  })

  it('renders label', () => {
    render(<ProgressRing value={50} label="Score" />)
    expect(screen.getByText('Score')).toBeInTheDocument()
  })

  it('uses label for aria-label', () => {
    render(<ProgressRing value={50} label="Score" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Score')
  })

  it('uses percentage for aria-label when no label', () => {
    render(<ProgressRing value={75} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', '75%')
  })

  it('renders svg as aria-hidden', () => {
    const { container } = render(<ProgressRing value={50} />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
