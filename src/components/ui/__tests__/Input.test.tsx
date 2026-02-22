import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../Input'
import { createElement } from 'react'

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  LazyMotion: ({ children }: any) => children,
  MotionConfig: ({ children }: any) => children,
  domAnimation: {},
  domMax: {},
  useInView: vi.fn().mockReturnValue(true),
  useScroll: vi.fn().mockReturnValue({ scrollYProgress: { get: () => 0 } }),
  useTransform: vi.fn().mockReturnValue(0),
  useMotionValue: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn(), on: vi.fn() }),
  useSpring: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn() }),
  useAnimate: vi.fn().mockReturnValue([{ current: null }, vi.fn()]),
  useAnimation: vi.fn().mockReturnValue({ start: vi.fn(), stop: vi.fn() }),
  useReducedMotion: vi.fn().mockReturnValue(false),
  m: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
  motion: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
}))

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('renders input element', () => {
    render(<Input label="Name" />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Input label="Email" error="Required field" />)
    expect(screen.getByText('Required field')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('sets aria-invalid when error', () => {
    render(<Input label="Email" error="Required" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows hint text', () => {
    render(<Input label="Email" hint="We will not share your email" />)
    expect(screen.getByText('We will not share your email')).toBeInTheDocument()
  })

  it('does not show hint when error is present', () => {
    render(<Input label="Email" hint="Hint" error="Error" />)
    expect(screen.queryByText('Hint')).not.toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('handles password toggle', () => {
    render(<Input label="Password" type="password" showPasswordToggle />)
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')
    // Toggle button should be rendered with accessible label
    const toggleBtn = screen.getByLabelText('Afficher le mot de passe')
    expect(toggleBtn).toBeInTheDocument()
    expect(toggleBtn.tagName).toBe('BUTTON')
  })

  it('renders clear button when clearable', () => {
    render(<Input label="Search" clearable value="test" onChange={() => {}} />)
    expect(screen.getByLabelText('Clear input')).toBeInTheDocument()
  })

  it('calls onClear when clear button clicked', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    render(<Input label="Search" clearable onClear={onClear} value="test" onChange={() => {}} />)
    await user.click(screen.getByLabelText('Clear input'))
    expect(onClear).toHaveBeenCalled()
  })

  it('renders character count', () => {
    render(<Input label="Bio" charCount maxLength={100} value="Hello" onChange={() => {}} />)
    expect(screen.getByText('5/100')).toBeInTheDocument()
  })

  it('renders as textarea when multiline', () => {
    render(<Input label="Description" multiline />)
    const textarea = document.querySelector('textarea')
    expect(textarea).toBeInTheDocument()
  })

  it('renders prefix and suffix', () => {
    render(<Input label="Amount" prefix={'$'} suffix={'USD'} />)
    expect(screen.getByText('$')).toBeInTheDocument()
    expect(screen.getByText('USD')).toBeInTheDocument()
  })
})
