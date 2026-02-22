import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement, useState } from 'react'

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
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
}))

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

import { MentionInput } from '../MentionInput'
import type { MentionUser } from '../MentionInput'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const members: MentionUser[] = [
  { id: '1', username: 'Alice', avatar_url: null },
  { id: '2', username: 'Bob', avatar_url: 'https://example.com/bob.png' },
  { id: '3', username: 'Charlie', avatar_url: null },
]

/** A wrapper that manages the controlled value so the input actually updates */
function MentionInputWrapper(props: {
  members: MentionUser[]
  initialValue?: string
  onSubmit?: () => void
  onChangeSpy?: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [value, setValue] = useState(props.initialValue || '')
  return (
    <MentionInput
      value={value}
      onChange={(v) => {
        setValue(v)
        props.onChangeSpy?.(v)
      }}
      onSubmit={props.onSubmit || (() => {})}
      members={props.members}
      placeholder={props.placeholder}
      disabled={props.disabled}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('MentionInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /* ---------- Basic rendering ---------- */

  it('renders an input element', () => {
    render(<MentionInputWrapper members={members} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders with custom placeholder', () => {
    render(<MentionInputWrapper members={members} placeholder="Write a message..." />)
    expect(screen.getByPlaceholderText('Write a message...')).toBeInTheDocument()
  })

  it('renders with disabled state', () => {
    render(<MentionInputWrapper members={members} disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('displays the initial value', () => {
    render(<MentionInputWrapper members={members} initialValue="Hello world" />)
    expect(screen.getByRole('textbox')).toHaveValue('Hello world')
  })

  it('has autocomplete off attributes', () => {
    render(<MentionInputWrapper members={members} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('autocomplete', 'off')
    expect(input).toHaveAttribute('spellcheck', 'false')
  })

  /* ---------- onChange ---------- */

  it('calls onChange when typing', () => {
    const spy = vi.fn()
    render(<MentionInputWrapper members={members} onChangeSpy={spy} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello', selectionStart: 5 } })
    expect(spy).toHaveBeenCalledWith('hello')
  })

  /* ---------- @ trigger ---------- */

  it('shows suggestions when typing @', () => {
    render(<MentionInputWrapper members={members} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '@', selectionStart: 1 } })
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('shows "Membres" header in suggestions', () => {
    render(<MentionInputWrapper members={members} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '@', selectionStart: 1 } })
    expect(screen.getByText('Membres')).toBeInTheDocument()
  })

  it('filters suggestions by typed text after @', () => {
    render(<MentionInputWrapper members={members} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '@al', selectionStart: 3 } })
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.queryByText('Bob')).not.toBeInTheDocument()
  })

  it('shows @ suggestions when @ is preceded by space', () => {
    render(<MentionInputWrapper members={members} initialValue="hello " />)
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'hello @', selectionStart: 7 },
    })
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('hides suggestions when query contains a space', () => {
    render(<MentionInputWrapper members={members} />)
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '@Alice rocks', selectionStart: 12 },
    })
    expect(screen.queryByText('Membres')).not.toBeInTheDocument()
  })

  it('hides suggestions when @ is mid-word (no space before)', () => {
    render(<MentionInputWrapper members={members} />)
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'email@', selectionStart: 6 },
    })
    expect(screen.queryByText('Membres')).not.toBeInTheDocument()
  })

  /* ---------- Avatar rendering ---------- */

  it('shows avatar image for members with avatar_url', () => {
    render(<MentionInputWrapper members={members} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '@', selectionStart: 1 } })
    const img = screen.getByAltText('')
    expect(img).toHaveAttribute('src', 'https://example.com/bob.png')
  })

  it('shows initial letter for members without avatar_url', () => {
    render(<MentionInputWrapper members={members} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '@', selectionStart: 1 } })
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
  })

  /* ---------- Keyboard navigation ---------- */

  it('ArrowDown moves selection forward', () => {
    render(<MentionInputWrapper members={members} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '@', selectionStart: 1 } })

    const firstButton = screen.getByText('Alice').closest('button')
    expect(firstButton?.className).toContain('bg-primary-15')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const secondButton = screen.getByText('Bob').closest('button')
    expect(secondButton?.className).toContain('bg-primary-15')
  })

  it('ArrowUp wraps from first to last', () => {
    render(<MentionInputWrapper members={members} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '@', selectionStart: 1 } })

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    const lastButton = screen.getByText('Charlie').closest('button')
    expect(lastButton?.className).toContain('bg-primary-15')
  })

  it('ArrowDown wraps from last to first', () => {
    render(<MentionInputWrapper members={members} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '@', selectionStart: 1 } })

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const firstButton = screen.getByText('Alice').closest('button')
    expect(firstButton?.className).toContain('bg-primary-15')
  })

  it('Tab inserts the selected mention', () => {
    const spy = vi.fn()
    render(<MentionInputWrapper members={members} onChangeSpy={spy} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '@', selectionStart: 1 } })
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(spy).toHaveBeenCalledWith('@Alice ')
  })

  it('Enter inserts the selected mention when suggestions are open', () => {
    const spy = vi.fn()
    render(<MentionInputWrapper members={members} onChangeSpy={spy} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '@', selectionStart: 1 } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(spy).toHaveBeenCalledWith('@Alice ')
  })

  it('Escape closes suggestions', () => {
    render(<MentionInputWrapper members={members} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '@', selectionStart: 1 } })
    expect(screen.getByText('Alice')).toBeInTheDocument()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByText('Membres')).not.toBeInTheDocument()
  })

  /* ---------- Click to insert ---------- */

  it('inserts mention when clicking a suggestion', () => {
    const spy = vi.fn()
    render(<MentionInputWrapper members={members} onChangeSpy={spy} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '@b', selectionStart: 2 } })
    fireEvent.click(screen.getByText('Bob'))
    expect(spy).toHaveBeenCalledWith('@Bob ')
  })

  /* ---------- Tab hint ---------- */

  it('shows Tab hint on selected item', () => {
    render(<MentionInputWrapper members={members} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '@', selectionStart: 1 } })
    expect(screen.getByText('Tab')).toBeInTheDocument()
  })

  /* ---------- Submit on Enter without suggestions ---------- */

  it('calls onSubmit on Enter when suggestions are closed', () => {
    const onSubmit = vi.fn()
    render(<MentionInputWrapper members={members} initialValue="hello" onSubmit={onSubmit} />)
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalled()
  })

  it('does not call onSubmit on Shift+Enter', () => {
    const onSubmit = vi.fn()
    render(<MentionInputWrapper members={members} initialValue="hello" onSubmit={onSubmit} />)
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: true })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  /* ---------- Outside click ---------- */

  it('closes suggestions on outside click', () => {
    render(<MentionInputWrapper members={members} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '@', selectionStart: 1 } })
    expect(screen.getByText('Alice')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('Membres')).not.toBeInTheDocument()
  })

  /* ---------- Max 6 suggestions ---------- */

  it('shows at most 6 filtered members', () => {
    const manyMembers = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      username: `User${i}`,
      avatar_url: null,
    }))
    render(<MentionInputWrapper members={manyMembers} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '@User', selectionStart: 5 } })
    const buttons = screen.getAllByText(/^User\d+$/)
    expect(buttons.length).toBeLessThanOrEqual(6)
  })

  /* ---------- Insert with partial query ---------- */

  it('correctly replaces partial mention text on insert', () => {
    const spy = vi.fn()
    render(<MentionInputWrapper members={members} onChangeSpy={spy} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'hello @al', selectionStart: 9 } })
    fireEvent.click(screen.getByText('Alice'))
    expect(spy).toHaveBeenCalledWith('hello @Alice ')
  })

  /* ---------- No suggestions without @ ---------- */

  it('does not show suggestions without @', () => {
    render(<MentionInputWrapper members={members} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello', selectionStart: 5 } })
    expect(screen.queryByText('Membres')).not.toBeInTheDocument()
  })

  /* ---------- case-insensitive filtering ---------- */

  it('filters case-insensitively', () => {
    render(<MentionInputWrapper members={members} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '@AL', selectionStart: 3 } })
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  /* ---------- No match shows nothing ---------- */

  it('hides dropdown when no members match', () => {
    render(<MentionInputWrapper members={members} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '@zzz', selectionStart: 4 } })
    expect(screen.queryByText('Membres')).not.toBeInTheDocument()
  })

  /* ---------- Selecting after navigation then clicking ---------- */

  it('navigates down then inserts via click', () => {
    const spy = vi.fn()
    render(<MentionInputWrapper members={members} onChangeSpy={spy} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '@', selectionStart: 1 } })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    // Bob is now selected
    fireEvent.click(screen.getByText('Bob'))
    expect(spy).toHaveBeenCalledWith('@Bob ')
  })
})
