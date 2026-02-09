import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from '../Select'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => {
        const { initial, animate, exit, transition, style: mStyle, ...rest } = props
        return <div style={mStyle} {...rest}>{children}</div>
      },
    },
  }
})

vi.mock('../../../utils/haptics', () => ({
  haptic: { selection: vi.fn() },
}))

const options = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular', disabled: true },
]

describe('Select', () => {
  it('renders with role=combobox', () => {
    render(<Select options={options} onChange={() => {}} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('shows placeholder when no value', () => {
    render(<Select options={options} onChange={() => {}} placeholder="Choose..." />)
    expect(screen.getByText('Choose...')).toBeInTheDocument()
  })

  it('shows selected value label', () => {
    render(<Select options={options} value="react" onChange={() => {}} />)
    expect(screen.getByText('React')).toBeInTheDocument()
  })

  it('opens dropdown on click', async () => {
    const user = userEvent.setup()
    render(<Select options={options} onChange={() => {}} />)
    await user.click(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('renders options in listbox', async () => {
    const user = userEvent.setup()
    render(<Select options={options} onChange={() => {}} />)
    await user.click(screen.getByRole('combobox'))
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('renders label', () => {
    render(<Select options={options} onChange={() => {}} label="Framework" />)
    expect(screen.getByText('Framework')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Select options={options} onChange={() => {}} error="Required" />)
    expect(screen.getByText('Required')).toBeInTheDocument()
  })

  it('sets aria-invalid when error', () => {
    render(<Select options={options} onChange={() => {}} error="Required" />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('sets aria-disabled when disabled', () => {
    render(<Select options={options} onChange={() => {}} disabled />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-disabled', 'true')
  })

  it('sets aria-expanded', async () => {
    const user = userEvent.setup()
    render(<Select options={options} onChange={() => {}} />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false')
    await user.click(screen.getByRole('combobox'))
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true')
  })
})
