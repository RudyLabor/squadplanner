import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SegmentedControl } from '../SegmentedControl'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => {
        const { layoutId, transition, ...rest } = props
        return <div {...rest}>{children}</div>
      },
    },
    m: {
      ...actual.m,
      div: ({ children, ...props }: any) => {
        const { layoutId, transition, ...rest } = props
        return <div {...rest}>{children}</div>
      },
    },
  }
})

const options = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

describe('SegmentedControl', () => {
  it('renders all options', () => {
    render(<SegmentedControl options={options} value="day" onChange={() => {}} />)
    expect(screen.getByText('Day')).toBeInTheDocument()
    expect(screen.getByText('Week')).toBeInTheDocument()
    expect(screen.getByText('Month')).toBeInTheDocument()
  })

  it('renders with role=tablist', () => {
    render(<SegmentedControl options={options} value="day" onChange={() => {}} />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('renders options as tabs', () => {
    render(<SegmentedControl options={options} value="day" onChange={() => {}} />)
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })

  it('marks active tab with aria-selected', () => {
    render(<SegmentedControl options={options} value="week" onChange={() => {}} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[2]).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onChange on option click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SegmentedControl options={options} value="day" onChange={onChange} />)
    await user.click(screen.getByText('Month'))
    expect(onChange).toHaveBeenCalledWith('month')
  })

  it('renders icons when provided', () => {
    const FakeIcon = ({ className }: { className?: string }) => <span className={className} data-testid="icon" />
    const optionsWithIcon = [{ value: 'a', label: 'A', icon: FakeIcon }]
    render(<SegmentedControl options={optionsWithIcon} value="a" onChange={() => {}} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })
})
