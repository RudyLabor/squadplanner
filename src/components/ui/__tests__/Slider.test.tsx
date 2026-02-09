import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Slider } from '../Slider'

describe('Slider', () => {
  it('renders with role=slider', () => {
    render(<Slider value={50} onChange={() => {}} />)
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('sets aria-valuenow', () => {
    render(<Slider value={75} onChange={() => {}} />)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '75')
  })

  it('sets aria-valuemin and aria-valuemax', () => {
    render(<Slider value={50} onChange={() => {}} min={0} max={100} />)
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('aria-valuemin', '0')
    expect(slider).toHaveAttribute('aria-valuemax', '100')
  })

  it('sets aria-label from label prop', () => {
    render(<Slider value={50} onChange={() => {}} label="Volume" />)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-label', 'Volume')
  })

  it('renders label text', () => {
    render(<Slider value={50} onChange={() => {}} label="Volume" />)
    expect(screen.getByText('Volume')).toBeInTheDocument()
  })

  it('shows value when showValue=true', () => {
    render(<Slider value={42} onChange={() => {}} showValue />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('uses formatValue for display', () => {
    render(<Slider value={50} onChange={() => {}} showValue formatValue={(v) => `${v}%`} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('is not focusable when disabled', () => {
    render(<Slider value={50} onChange={() => {}} disabled />)
    expect(screen.getByRole('slider')).toHaveAttribute('tabindex', '-1')
  })

  it('sets aria-disabled when disabled', () => {
    render(<Slider value={50} onChange={() => {}} disabled />)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-disabled', 'true')
  })

  it('handles keyboard ArrowRight', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Slider value={50} onChange={onChange} step={5} />)
    screen.getByRole('slider').focus()
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith(55)
  })

  it('handles keyboard ArrowLeft', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Slider value={50} onChange={onChange} step={5} />)
    screen.getByRole('slider').focus()
    await user.keyboard('{ArrowLeft}')
    expect(onChange).toHaveBeenCalledWith(45)
  })

  it('handles Home key', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Slider value={50} onChange={onChange} min={0} />)
    screen.getByRole('slider').focus()
    await user.keyboard('{Home}')
    expect(onChange).toHaveBeenCalledWith(0)
  })

  it('handles End key', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Slider value={50} onChange={onChange} max={100} />)
    screen.getByRole('slider').focus()
    await user.keyboard('{End}')
    expect(onChange).toHaveBeenCalledWith(100)
  })
})
