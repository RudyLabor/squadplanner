import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

vi.mock('../../icons', () => ({
  AlertTriangle: (props: any) => createElement('span', { ...props, 'data-testid': 'alert-icon' }, 'alert'),
  X: (props: any) => createElement('span', props, 'x'),
}))

vi.mock('../Dialog', () => ({
  Dialog: ({ children, open, title }: any) => open ? createElement('div', { role: 'dialog', 'aria-labelledby': 'dialog-title' }, createElement('h2', { id: 'dialog-title' }, title), children) : null,
  DialogBody: ({ children }: any) => createElement('div', { 'data-testid': 'dialog-body' }, children),
  DialogFooter: ({ children }: any) => createElement('div', { 'data-testid': 'dialog-footer' }, children),
}))

vi.mock('../Sheet', () => ({
  Sheet: ({ children, open, title }: any) => open ? createElement('div', { 'data-testid': 'sheet', role: 'dialog' }, createElement('h2', null, title), children) : null,
}))

vi.mock('../Button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => createElement('button', { onClick, disabled, ...props }, children),
}))

import { ConfirmDialog } from '../ConfirmDialog'

describe('ConfirmDialog', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true })
    window.dispatchEvent(new Event('resize'))
  })

  // STRICT: desktop open renders dialog, title, description, default labels, alert icon, confirm has aria-label
  it('renders complete dialog with all elements on desktop', () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Supprimer la session"
        description="Cette action est irreversible."
      />
    )

    // Title and description rendered
    expect(screen.getByText('Supprimer la session')).toBeInTheDocument()
    expect(screen.getByText('Cette action est irreversible.')).toBeInTheDocument()

    // Default button labels
    const confirmBtns = screen.getAllByText('Confirmer')
    expect(confirmBtns.length).toBeGreaterThan(0)
    const cancelBtns = screen.getAllByText('Annuler')
    expect(cancelBtns.length).toBeGreaterThan(0)

    // Dialog role present
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Alert icon rendered
    const alertIcons = screen.getAllByTestId('alert-icon')
    expect(alertIcons.length).toBeGreaterThan(0)

    // Confirm button has aria-label
    const confirmBtn = screen.getAllByLabelText('Confirmer')
    expect(confirmBtn.length).toBeGreaterThan(0)
  })

  // STRICT: click handlers fire correctly, cancel calls onClose, confirm calls onConfirm
  it('fires onClose on cancel click and onConfirm on confirm click', () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Test"
        description="Test desc"
        confirmLabel="Oui"
        cancelLabel="Non"
      />
    )

    // Custom labels rendered
    const ouiBtns = screen.getAllByText('Oui')
    const nonBtns = screen.getAllByText('Non')
    expect(ouiBtns.length).toBeGreaterThan(0)
    expect(nonBtns.length).toBeGreaterThan(0)

    // Click cancel
    fireEvent.click(nonBtns[0])
    expect(onClose).toHaveBeenCalledTimes(1)

    // Click confirm
    fireEvent.click(ouiBtns[0])
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  // STRICT: isLoading disables both buttons
  it('disables both buttons when isLoading is true', () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Loading"
        description="Please wait"
        isLoading={true}
      />
    )

    const buttons = screen.getAllByRole('button')
    // All buttons should be disabled
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  // STRICT: renders nothing when closed
  it('renders nothing when open is false', () => {
    render(
      <ConfirmDialog
        open={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Hidden"
        description="Should not appear"
      />
    )

    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
    expect(screen.queryByText('Should not appear')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  // STRICT: mobile renders Sheet instead of Dialog
  it('renders Sheet on mobile (innerWidth < 1024)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true })
    window.dispatchEvent(new Event('resize'))

    render(
      <ConfirmDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Mobile Dialog"
        description="Mobile description"
      />
    )

    expect(screen.getByTestId('sheet')).toBeInTheDocument()
    expect(screen.getByText('Mobile Dialog')).toBeInTheDocument()
    expect(screen.getByText('Mobile description')).toBeInTheDocument()
  })
})
