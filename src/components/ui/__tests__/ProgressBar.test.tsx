import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from '../ProgressBar'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => {
        const { initial, animate, exit, transition, style: mStyle, ...rest } = props
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
        const { initial, animate, exit, transition, style: mStyle, ...rest } = props
        return (
          <div style={mStyle} {...rest}>
            {children}
          </div>
        )
      },
    },
  }
})

describe('ProgressBar', () => {
  it('renders with role=progressbar', () => {
    render(<ProgressBar value={50} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('sets aria-valuenow', () => {
    render(<ProgressBar value={75} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75')
  })

  it('sets aria-valuemin and aria-valuemax', () => {
    render(<ProgressBar value={50} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('clamps value between 0 and 100', () => {
    render(<ProgressBar value={150} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('renders label', () => {
    render(<ProgressBar value={50} label="Progress" />)
    expect(screen.getByText('Progress')).toBeInTheDocument()
  })

  it('renders value text when showValue', () => {
    render(<ProgressBar value={75} showValue />)
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('renders indeterminate when no value', () => {
    render(<ProgressBar />)
    const bar = screen.getByRole('progressbar')
    expect(bar).not.toHaveAttribute('aria-valuenow')
  })

  it('renders stepped progress', () => {
    render(<ProgressBar stepped={{ steps: 5, current: 3 }} showValue />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3')
    expect(screen.getByText('3/5')).toBeInTheDocument()
  })

  it('sets aria-label from label prop', () => {
    render(<ProgressBar value={50} label="Upload" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Upload')
  })

  it('defaults aria-label to Progress', () => {
    render(<ProgressBar value={50} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Progress')
  })
})
