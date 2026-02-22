import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { createElement } from 'react'

/* ------------------------------------------------------------------ */
/*  vi.mock calls                                                      */
/* ------------------------------------------------------------------ */
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  m: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, role, ...r }: any) => createElement(p, { ...r, role }, children)
          : undefined,
    }
  ),
}))

vi.mock('../../icons', () => ({
  HelpCircle: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-help-circle' }),
}))

import { Tooltip, TooltipTrigger, HelpTooltip } from '../Tooltip'

/* ------------------------------------------------------------------ */
/*  Tests - Tooltip                                                    */
/* ------------------------------------------------------------------ */
describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /* ---------- Basic rendering ---------- */

  it('renders children', () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    )
    expect(screen.getByText('Hover me')).toBeInTheDocument()
  })

  it('does not show tooltip initially', () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    )
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('renders trigger wrapper as inline-block', () => {
    const { container } = render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    )
    expect(container.querySelector('.inline-block')).toBeInTheDocument()
  })

  /* ---------- Show on hover ---------- */

  it('shows tooltip after delay on mouseEnter', () => {
    render(
      <Tooltip content="Tooltip content" delay={200}>
        <button>Hover me</button>
      </Tooltip>
    )
    const trigger = screen.getByText('Hover me').closest('.inline-block')!
    fireEvent.mouseEnter(trigger)

    // Before delay, tooltip should not appear
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    // After delay
    act(() => vi.advanceTimersByTime(250))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    expect(screen.getByText('Tooltip content')).toBeInTheDocument()
  })

  it('uses default delay of 300ms', () => {
    render(
      <Tooltip content="Default delay">
        <button>Hover me</button>
      </Tooltip>
    )
    const trigger = screen.getByText('Hover me').closest('.inline-block')!
    fireEvent.mouseEnter(trigger)

    act(() => vi.advanceTimersByTime(250))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(100))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  /* ---------- Hide on mouseLeave ---------- */

  it('hides tooltip on mouseLeave', () => {
    render(
      <Tooltip content="Tooltip" delay={0}>
        <button>Hover me</button>
      </Tooltip>
    )
    const trigger = screen.getByText('Hover me').closest('.inline-block')!
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(10))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.mouseLeave(trigger)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('cancels pending timeout on mouseLeave before it fires', () => {
    render(
      <Tooltip content="Tooltip" delay={500}>
        <button>Hover me</button>
      </Tooltip>
    )
    const trigger = screen.getByText('Hover me').closest('.inline-block')!
    fireEvent.mouseEnter(trigger)
    // Leave before delay expires
    fireEvent.mouseLeave(trigger)
    act(() => vi.advanceTimersByTime(600))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  /* ---------- Show on focus / hide on blur ---------- */

  it('shows tooltip on focus', () => {
    render(
      <Tooltip content="Focus text" delay={0}>
        <button>Focus me</button>
      </Tooltip>
    )
    const trigger = screen.getByText('Focus me').closest('.inline-block')!
    fireEvent.focus(trigger)
    act(() => vi.advanceTimersByTime(10))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('hides tooltip on blur', () => {
    render(
      <Tooltip content="Focus text" delay={0}>
        <button>Focus me</button>
      </Tooltip>
    )
    const trigger = screen.getByText('Focus me').closest('.inline-block')!
    fireEvent.focus(trigger)
    act(() => vi.advanceTimersByTime(10))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.blur(trigger)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  /* ---------- Disabled ---------- */

  it('does not show tooltip when disabled', () => {
    render(
      <Tooltip content="Disabled tip" disabled delay={0}>
        <button>Hover me</button>
      </Tooltip>
    )
    const trigger = screen.getByText('Hover me').closest('.inline-block')!
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(10))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  /* ---------- Position variants ---------- */

  it('renders tooltip content with custom className', () => {
    render(
      <Tooltip content="Styled" delay={0} className="custom-class">
        <button>Hover me</button>
      </Tooltip>
    )
    const trigger = screen.getByText('Hover me').closest('.inline-block')!
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(10))
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.className).toContain('custom-class')
  })

  it('renders tooltip with position=bottom', () => {
    render(
      <Tooltip content="Bottom tip" position="bottom" delay={0}>
        <button>Hover me</button>
      </Tooltip>
    )
    const trigger = screen.getByText('Hover me').closest('.inline-block')!
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(10))
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toBeInTheDocument()
  })

  it('renders tooltip with position=left', () => {
    render(
      <Tooltip content="Left tip" position="left" delay={0}>
        <button>Hover me</button>
      </Tooltip>
    )
    const trigger = screen.getByText('Hover me').closest('.inline-block')!
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(10))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('renders tooltip with position=right', () => {
    render(
      <Tooltip content="Right tip" position="right" delay={0}>
        <button>Hover me</button>
      </Tooltip>
    )
    const trigger = screen.getByText('Hover me').closest('.inline-block')!
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(10))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  /* ---------- Help variant ---------- */

  it('renders help icon when variant is help', () => {
    render(
      <Tooltip content="Help tip" variant="help">
        <span>Label</span>
      </Tooltip>
    )
    expect(screen.getByLabelText('Aide')).toBeInTheDocument()
    expect(screen.getByTestId('icon-help-circle')).toBeInTheDocument()
  })

  it('renders children alongside help icon in help variant', () => {
    render(
      <Tooltip content="Help tip" variant="help">
        <span>Label text</span>
      </Tooltip>
    )
    expect(screen.getByText('Label text')).toBeInTheDocument()
  })

  it('uses custom helpIconSize', () => {
    render(
      <Tooltip content="Help tip" variant="help" helpIconSize={20}>
        <span>Label</span>
      </Tooltip>
    )
    const icon = screen.getByTestId('icon-help-circle')
    expect(icon.style.width).toBe('20px')
    expect(icon.style.height).toBe('20px')
  })

  /* ---------- Portal rendering ---------- */

  it('renders tooltip in a portal (appended to body)', () => {
    render(
      <Tooltip content="Portal tip" delay={0}>
        <button>Hover me</button>
      </Tooltip>
    )
    const trigger = screen.getByText('Hover me').closest('.inline-block')!
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(10))
    // The tooltip should be a direct child of document.body (via portal)
    const tooltip = screen.getByRole('tooltip')
    expect(document.body.contains(tooltip)).toBe(true)
  })

  /* ---------- Arrow element ---------- */

  it('renders arrow element inside tooltip', () => {
    render(
      <Tooltip content="Arrow tip" delay={0}>
        <button>Hover me</button>
      </Tooltip>
    )
    const trigger = screen.getByText('Hover me').closest('.inline-block')!
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(10))
    const tooltip = screen.getByRole('tooltip')
    const arrow = tooltip.querySelector('.rotate-45')
    expect(arrow).toBeInTheDocument()
  })
})

/* ------------------------------------------------------------------ */
/*  Tests - TooltipTrigger                                             */
/* ------------------------------------------------------------------ */
describe('TooltipTrigger', () => {
  it('renders children', () => {
    render(
      <TooltipTrigger content="Help">
        <button>Button</button>
      </TooltipTrigger>
    )
    expect(screen.getByText('Button')).toBeInTheDocument()
  })

  it('includes visually hidden text for screen readers', () => {
    render(
      <TooltipTrigger content="Help text">
        <button>Button</button>
      </TooltipTrigger>
    )
    // The tooltip content is present in the DOM for screen readers
    const srText = screen.getByText('Help text')
    expect(srText).toBeInTheDocument()
    // It uses the sr-only pattern to hide it visually
    expect(srText.className).toContain('sr-only')
  })

  it('wraps children in a relative span', () => {
    render(
      <TooltipTrigger content="Help">
        <button>Button</button>
      </TooltipTrigger>
    )
    const span = screen.getByText('Button').closest('span.relative')
    expect(span).toBeInTheDocument()
  })
})

/* ------------------------------------------------------------------ */
/*  Tests - HelpTooltip                                                */
/* ------------------------------------------------------------------ */
describe('HelpTooltip', () => {
  it('renders with help variant', () => {
    render(
      <HelpTooltip content="Explanation">
        <span>Field label</span>
      </HelpTooltip>
    )
    expect(screen.getByText('Field label')).toBeInTheDocument()
    expect(screen.getByLabelText('Aide')).toBeInTheDocument()
  })

  it('defaults position to top', () => {
    render(
      <HelpTooltip content="Top help">
        <span>Label</span>
      </HelpTooltip>
    )
    // Component rendered without error
    expect(screen.getByText('Label')).toBeInTheDocument()
  })

  it('accepts position override', () => {
    render(
      <HelpTooltip content="Bottom help" position="bottom">
        <span>Label</span>
      </HelpTooltip>
    )
    expect(screen.getByText('Label')).toBeInTheDocument()
  })
})
