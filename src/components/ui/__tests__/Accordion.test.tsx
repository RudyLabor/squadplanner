import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../Accordion'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => <div {...stripMotionProps(props)}>{children}</div>,
      span: ({ children, ...props }: any) => <span {...stripMotionProps(props)}>{children}</span>,
    },
    m: {
      ...actual.m,
      div: ({ children, ...props }: any) => <div {...stripMotionProps(props)}>{children}</div>,
      span: ({ children, ...props }: any) => <span {...stripMotionProps(props)}>{children}</span>,
    },
  }
})

function stripMotionProps(props: Record<string, unknown>) {
  const clean = { ...props }
  const motionKeys = [
    'initial',
    'animate',
    'exit',
    'transition',
    'whileHover',
    'whileTap',
    'layout',
    'layoutId',
    'variants',
  ]
  motionKeys.forEach((k) => delete clean[k])
  return clean
}

vi.mock('../../../utils/haptics', () => ({
  haptic: { selection: vi.fn(), light: vi.fn(), medium: vi.fn() },
}))

function renderAccordion(
  props: {
    type?: 'single' | 'multiple'
    value?: string | string[]
    onChange?: (v: any) => void
  } = {}
) {
  const onChange = props.onChange ?? vi.fn()
  return render(
    <Accordion type={props.type} value={props.value ?? ''} onChange={onChange}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Section 1</AccordionTrigger>
        <AccordionContent>Content 1</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Section 2</AccordionTrigger>
        <AccordionContent>Content 2</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3" disabled>
        <AccordionTrigger>Section 3</AccordionTrigger>
        <AccordionContent>Content 3</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

describe('Accordion', () => {
  it('renders all triggers', () => {
    renderAccordion()
    expect(screen.getByText('Section 1')).toBeInTheDocument()
    expect(screen.getByText('Section 2')).toBeInTheDocument()
    expect(screen.getByText('Section 3')).toBeInTheDocument()
  })

  it('shows content when item is expanded', () => {
    renderAccordion({ value: 'item-1' })
    expect(screen.getByText('Content 1')).toBeInTheDocument()
  })

  it('hides content when item is collapsed', () => {
    renderAccordion({ value: '' })
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
  })

  it('calls onChange when trigger is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderAccordion({ onChange })
    await user.click(screen.getByText('Section 1'))
    expect(onChange).toHaveBeenCalledWith('item-1')
  })

  it('collapses expanded item in single mode', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderAccordion({ type: 'single', value: 'item-1', onChange })
    await user.click(screen.getByText('Section 1'))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('supports multiple expansion', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderAccordion({ type: 'multiple', value: ['item-1'], onChange })
    await user.click(screen.getByText('Section 2'))
    expect(onChange).toHaveBeenCalledWith(['item-1', 'item-2'])
  })

  it('does not toggle disabled item', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderAccordion({ onChange })
    await user.click(screen.getByText('Section 3'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('sets aria-expanded on trigger buttons', () => {
    renderAccordion({ value: 'item-1' })
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true')
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'false')
  })

  it('sets aria-disabled on disabled trigger', () => {
    renderAccordion()
    const buttons = screen.getAllByRole('button')
    expect(buttons[2]).toBeDisabled()
  })

  it('renders content region with role=region', () => {
    renderAccordion({ value: 'item-1' })
    expect(screen.getByRole('region')).toBeInTheDocument()
  })
})
