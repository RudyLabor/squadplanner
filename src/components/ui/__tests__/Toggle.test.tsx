import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toggle } from '../Toggle'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    motion: {
      ...actual.motion,
      span: ({ children, ...props }: any) => {
        const { layout, initial, animate, transition, ...rest } = props
        return <span {...rest}>{children}</span>
      },
    },
  }
})

vi.mock('../../../utils/haptics', () => ({
  haptic: { selection: vi.fn() },
}))

describe('Toggle', () => {
  it('renders with role=switch', () => {
    render(<Toggle checked={false} onChange={() => {}} />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('shows checked state', () => {
    render(<Toggle checked={true} onChange={() => {}} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('shows unchecked state', () => {
    render(<Toggle checked={false} onChange={() => {}} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onChange on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} />)
    await user.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('calls onChange(false) when checked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Toggle checked={true} onChange={onChange} />)
    await user.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} disabled />)
    await user.click(screen.getByRole('switch'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders label', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Dark mode" />)
    expect(screen.getByText('Dark mode')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Toggle" description="Some info" />)
    expect(screen.getByText('Some info')).toBeInTheDocument()
  })

  it('links description via aria-describedby', () => {
    render(<Toggle checked={false} onChange={() => {}} description="Help" />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-describedby')
  })

  it('is disabled', () => {
    render(<Toggle checked={false} onChange={() => {}} disabled />)
    expect(screen.getByRole('switch')).toBeDisabled()
  })

  it('sets aria-label from label prop', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Enable" />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'Enable')
  })
})
