import { describe, it, expect, vi } from 'vitest'
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

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }), signOut: vi.fn() },
    from: vi.fn().mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }) }),
  },
}))

vi.mock('../../../lib/toast', () => ({
  showError: vi.fn(),
}))

import { SettingsDeleteModal } from '../SettingsDeleteModal'

describe('SettingsDeleteModal', () => {
  // STRICT: verifies closed state — no modal content, no heading, no input, no buttons visible
  it('renders nothing when isOpen is false', () => {
    const { container } = render(<SettingsDeleteModal isOpen={false} onClose={vi.fn()} />)

    // 1. No heading
    expect(screen.queryByText('Supprimer ton compte')).toBeNull()
    // 2. No description text
    expect(screen.queryByText(/irréversible/)).toBeNull()
    // 3. No input field
    expect(container.querySelector('input')).toBeNull()
    // 4. No cancel button
    expect(screen.queryByText('Annuler')).toBeNull()
    // 5. No delete button
    expect(screen.queryByText('Supprimer définitivement')).toBeNull()
    // 6. Container has no modal overlay
    expect(container.querySelector('.fixed')).toBeNull()
  })

  // STRICT: verifies open state — heading, warning text, input with placeholder, cancel button, disabled delete button, confirmation requirement
  it('renders modal with heading, warning, input, cancel button, and disabled delete button', () => {
    const { container } = render(<SettingsDeleteModal isOpen={true} onClose={vi.fn()} />)

    // 1. Heading
    expect(screen.getByText('Supprimer ton compte')).toBeDefined()
    // 2. Warning about irreversibility
    expect(screen.getByText(/irr/)).toBeDefined()
    // 3. Warning about data deletion
    expect(screen.getByText(/profil, messages, squads/)).toBeDefined()
    // 4. Confirmation instruction
    expect(screen.getByText(/Tape/)).toBeDefined()
    expect(screen.getByText('SUPPRIMER')).toBeDefined()
    // 5. Input field with placeholder
    const input = container.querySelector('input')
    expect(input).not.toBeNull()
    expect(input?.placeholder).toBe('SUPPRIMER')
    // 6. Cancel button
    expect(screen.getByText('Annuler')).toBeDefined()
    // 7. Delete button present but disabled
    const deleteBtn = screen.getByText('Supprimer définitivement').closest('button')
    expect(deleteBtn).not.toBeNull()
    expect(deleteBtn?.disabled).toBe(true)
  })

  // STRICT: verifies delete button enable logic — typing "SUPPRIMER" enables, wrong text keeps disabled, cancel resets
  it('enables delete button only when typing exact "SUPPRIMER" text and cancel resets form', () => {
    const onClose = vi.fn()
    const { container } = render(<SettingsDeleteModal isOpen={true} onClose={onClose} />)
    const input = container.querySelector('input')!
    const deleteBtn = screen.getByText('Supprimer définitivement').closest('button')!

    // 1. Initially disabled
    expect(deleteBtn.disabled).toBe(true)

    // 2. Wrong text keeps disabled
    fireEvent.change(input, { target: { value: 'supprimer' } })
    expect(deleteBtn.disabled).toBe(true)

    // 3. Partial text keeps disabled
    fireEvent.change(input, { target: { value: 'SUPPRIME' } })
    expect(deleteBtn.disabled).toBe(true)

    // 4. Exact match enables button
    fireEvent.change(input, { target: { value: 'SUPPRIMER' } })
    expect(deleteBtn.disabled).toBe(false)

    // 5. Click cancel calls onClose
    fireEvent.click(screen.getByText('Annuler'))
    expect(onClose).toHaveBeenCalledTimes(1)

    // 6. Input value updated correctly
    expect(input.value).toBe('')
  })
})
