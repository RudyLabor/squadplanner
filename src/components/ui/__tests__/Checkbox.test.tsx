import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from '../Checkbox'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    motion: {
      ...actual.motion,
      svg: ({ children, ...props }: any) => {
        const { initial, animate, transition, ...rest } = props
        return <svg {...rest}>{children}</svg>
      },
      path: (props: any) => {
        const { initial, animate, transition, ...rest } = props
        return <path {...rest} />
      },
    },
    m: {
      ...actual.m,
      svg: ({ children, ...props }: any) => {
        const { initial, animate, transition, ...rest } = props
        return <svg {...rest}>{children}</svg>
      },
      path: (props: any) => {
        const { initial, animate, transition, ...rest } = props
        return <path {...rest} />
      },
    },
  }
})

vi.mock('../../../utils/haptics', () => ({
  haptic: { light: vi.fn() },
}))

describe('Checkbox', () => {
  it('renders with label', () => {
    render(<Checkbox checked={false} onChange={() => {}} label="Accept terms" />)
    expect(screen.getByLabelText('Accept terms')).toBeInTheDocument()
  })

  it('has role=checkbox', () => {
    render(<Checkbox checked={false} onChange={() => {}} label="Check" />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('reflects checked state', () => {
    render(<Checkbox checked={true} onChange={() => {}} label="Check" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
  })

  it('reflects unchecked state', () => {
    render(<Checkbox checked={false} onChange={() => {}} label="Check" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false')
  })

  it('reflects indeterminate state', () => {
    render(<Checkbox checked="indeterminate" onChange={() => {}} label="Check" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed')
  })

  it('calls onChange when clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Checkbox checked={false} onChange={onChange} label="Check" />)
    await user.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('calls onChange(false) when checked and clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Checkbox checked={true} onChange={onChange} label="Check" />)
    await user.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Checkbox checked={false} onChange={onChange} label="Check" disabled />)
    await user.click(screen.getByRole('checkbox'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders description', () => {
    render(
      <Checkbox checked={false} onChange={() => {}} label="Check" description="Some help text" />
    )
    expect(screen.getByText('Some help text')).toBeInTheDocument()
  })

  it('links description via aria-describedby', () => {
    render(<Checkbox checked={false} onChange={() => {}} label="Check" description="Help" />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('aria-describedby')
  })

  it('is disabled with aria', () => {
    render(<Checkbox checked={false} onChange={() => {}} label="Check" disabled />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })
})
