import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RadioGroup, Radio } from '../RadioGroup'
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
  m: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
  motion: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
}))

describe('RadioGroup', () => {
  it('renders with role=radiogroup', () => {
    render(
      <RadioGroup value="a" onChange={() => {}}>
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" />
      </RadioGroup>
    )
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('renders radio options with role=radio', () => {
    render(
      <RadioGroup value="a" onChange={() => {}}>
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" />
      </RadioGroup>
    )
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })

  it('marks selected radio as checked', () => {
    render(
      <RadioGroup value="b" onChange={() => {}}>
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" />
      </RadioGroup>
    )
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAttribute('aria-checked', 'false')
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onChange when option is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <RadioGroup value="a" onChange={onChange}>
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" />
      </RadioGroup>
    )
    await user.click(screen.getByText('Option B'))
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('does not call onChange for disabled option', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <RadioGroup value="a" onChange={onChange}>
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" disabled />
      </RadioGroup>
    )
    await user.click(screen.getByText('Option B'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders description for radio option', () => {
    render(
      <RadioGroup value="a" onChange={() => {}}>
        <Radio value="a" label="Option A" description="First option" />
      </RadioGroup>
    )
    expect(screen.getByText('First option')).toBeInTheDocument()
  })

  it('supports card variant', () => {
    const { container } = render(
      <RadioGroup value="a" onChange={() => {}}>
        <Radio value="a" label="Card" variant="card" />
      </RadioGroup>
    )
    expect(container.querySelector('.p-4')).toBeInTheDocument()
  })

  it('sets aria-orientation', () => {
    render(
      <RadioGroup value="a" onChange={() => {}} orientation="horizontal">
        <Radio value="a" label="A" />
      </RadioGroup>
    )
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-orientation', 'horizontal')
  })

  it('sets tabIndex correctly', () => {
    render(
      <RadioGroup value="b" onChange={() => {}}>
        <Radio value="a" label="A" />
        <Radio value="b" label="B" />
      </RadioGroup>
    )
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAttribute('tabindex', '-1')
    expect(radios[1]).toHaveAttribute('tabindex', '0')
  })
})
