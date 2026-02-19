/**
 * P2.4 — Enhanced accessibility tests
 * Keyboard navigation, focus trap, ARIA live regions
 * Tests real components with no mocking (like the axe tests)
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Button } from '../Button'
import { Input } from '../Input'
import { Dialog } from '../Dialog'
import { ProgressBar } from '../ProgressBar'

// ═══════════════════════════════════════════════════════════
// KEYBOARD NAVIGATION TESTS
// ═══════════════════════════════════════════════════════════

describe('Button keyboard interaction', () => {
  it('should be focusable with Tab', async () => {
    const user = userEvent.setup()
    render(<Button>Click me</Button>)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Click me' })).toHaveFocus()
  })

  it('should trigger onClick with Enter key', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>Confirm</Button>)
    await user.tab()
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('should trigger onClick with Space key', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>Confirm</Button>)
    await user.tab()
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('should NOT trigger onClick when disabled', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>
    )
    await user.tab()
    await user.keyboard('{Enter}')
    expect(onClick).not.toHaveBeenCalled()
  })

  it('Multiple buttons reachable in Tab order', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Button>First</Button>
        <Button>Second</Button>
        <Button>Third</Button>
      </div>
    )
    await user.tab()
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Third' })).toHaveFocus()
  })

  it('Shift+Tab moves focus backwards', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Button>First</Button>
        <Button>Second</Button>
      </div>
    )
    await user.tab()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus()
  })
})

// ═══════════════════════════════════════════════════════════
// FOCUS TRAP TESTS (Dialog)
// ═══════════════════════════════════════════════════════════

describe('Dialog focus trap', () => {
  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('should have role="dialog" and aria-modal="true"', () => {
    render(
      <Dialog open={true} onClose={() => {}} title="Test Dialog">
        <button>Inside</button>
      </Dialog>
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('should have aria-labelledby linked to title', () => {
    render(
      <Dialog open={true} onClose={() => {}} title="My Title">
        <button>Inside</button>
      </Dialog>
    )
    const dialog = screen.getByRole('dialog')
    const labelledBy = dialog.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    const titleEl = document.getElementById(labelledBy!)
    expect(titleEl?.textContent).toBe('My Title')
  })

  it('should call onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <Dialog open={true} onClose={onClose} title="Test">
        <button>Inside</button>
      </Dialog>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should NOT call onClose on Escape when closeOnEscape is false', () => {
    const onClose = vi.fn()
    render(
      <Dialog open={true} onClose={onClose} closeOnEscape={false} title="Test">
        <button>Inside</button>
      </Dialog>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('should lock body scroll when open', () => {
    render(
      <Dialog open={true} onClose={() => {}} title="Test">
        <p>Content</p>
      </Dialog>
    )
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('should restore body scroll when closed', () => {
    const { rerender } = render(
      <Dialog open={true} onClose={() => {}} title="Test">
        <p>Content</p>
      </Dialog>
    )
    expect(document.body.style.overflow).toBe('hidden')
    rerender(
      <Dialog open={false} onClose={() => {}} title="Test">
        <p>Content</p>
      </Dialog>
    )
    expect(document.body.style.overflow).toBe('')
  })

  it('should trap Tab at last element → jump to first', () => {
    render(
      <Dialog open={true} onClose={() => {}} title="Trap" showCloseButton={false}>
        <button data-testid="first">First</button>
        <button data-testid="second">Second</button>
        <button data-testid="last">Last</button>
      </Dialog>
    )
    const last = screen.getByTestId('last')
    last.focus()
    expect(last).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(screen.getByTestId('first')).toHaveFocus()
  })

  it('should trap Shift+Tab at first → jump to last', () => {
    render(
      <Dialog open={true} onClose={() => {}} title="Trap" showCloseButton={false}>
        <button data-testid="first">First</button>
        <button data-testid="second">Second</button>
        <button data-testid="last">Last</button>
      </Dialog>
    )
    const first = screen.getByTestId('first')
    first.focus()
    expect(first).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(screen.getByTestId('last')).toHaveFocus()
  })

  it('should render nothing when open=false', () => {
    render(
      <Dialog open={false} onClose={() => {}} title="Hidden">
        <p>Not visible</p>
      </Dialog>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('close button should have aria-label="Close"', () => {
    render(
      <Dialog open={true} onClose={() => {}} showCloseButton={true} title="Test">
        <button>Inside</button>
      </Dialog>
    )
    const closeBtn = screen.getByLabelText('Close')
    expect(closeBtn).toBeInTheDocument()
    expect(closeBtn.tagName.toLowerCase()).toBe('button')
  })
})

// ═══════════════════════════════════════════════════════════
// ARIA STATE TESTS
// ═══════════════════════════════════════════════════════════

describe('ARIA states', () => {
  it('ProgressBar should expose current value via aria-valuenow', () => {
    render(<ProgressBar value={75} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '75')
  })

  it('Input error should be linked via aria-describedby', () => {
    render(<Input label="Email" error="Required field" />)
    const input = screen.getByLabelText(/email/i)
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    if (describedBy) {
      const errorEl = document.getElementById(describedBy)
      expect(errorEl?.textContent).toContain('Required field')
    }
  })

  it('Input should have aria-invalid when error is present', () => {
    render(<Input label="Email" error="Bad format" />)
    const input = screen.getByLabelText(/email/i)
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })
})
