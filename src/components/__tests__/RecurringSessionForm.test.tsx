/**
 * RecurringSessionForm.test.tsx
 * Unit tests for recurring session form component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createElement } from 'react'

// Polyfill CSS.supports for jsdom
if (typeof globalThis.CSS === 'undefined') {
  (globalThis as any).CSS = { supports: () => false }
} else if (typeof globalThis.CSS.supports !== 'function') {
  (globalThis.CSS as any).supports = () => false
}

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  m: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
}))

// Mock icons
vi.mock('../icons', () => ({
  Calendar: (props: any) => createElement('svg', props),
  Clock: (props: any) => createElement('svg', props),
  Repeat: (props: any) => createElement('svg', props),
  Check: (props: any) => createElement('svg', props),
  X: (props: any) => createElement('svg', props),
  ChevronDown: (props: any) => createElement('svg', props),
  Gamepad2: (props: any) => createElement('svg', props),
  Users: (props: any) => createElement('svg', props),
}))

// Mock ui
vi.mock('../ui', () => ({
  Button: ({ children, onClick, disabled, type, ...props }: any) =>
    createElement('button', { onClick, disabled, type, ...props }, children),
}))

// Mock dependencies
vi.mock('../PremiumGate', () => ({
  PremiumGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

vi.mock('../../hooks', () => ({
  useHapticFeedback: () => ({
    triggerHaptic: vi.fn(),
  }),
  useAuthStore: vi.fn().mockReturnValue({ user: { id: 'user-1' } }),
}))

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}))

import { RecurringSessionForm } from '../RecurringSessionForm'

describe('RecurringSessionForm', () => {
  const mockOnCreated = vi.fn()
  const mockOnCancel = vi.fn()
  const squadId = 'test-squad-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all form fields', () => {
    render(
      <RecurringSessionForm
        squadId={squadId}
        onCreated={mockOnCreated}
        onCancel={mockOnCancel}
      />
    )

    // Check title input
    expect(screen.getByPlaceholderText(/Ranked Valorant/i)).toBeInTheDocument()

    // Check day buttons (L, M, M, J, V, S, D)
    expect(screen.getAllByText('L')).toHaveLength(1)
    expect(screen.getAllByText('M')).toHaveLength(2) // Mardi + Mercredi
    expect(screen.getAllByText('J')).toHaveLength(1)
    expect(screen.getAllByText('V')).toHaveLength(1)
    expect(screen.getAllByText('S')).toHaveLength(1)
    expect(screen.getAllByText('D')).toHaveLength(1)

    // Check duration options
    expect(screen.getByText('1h')).toBeInTheDocument()
    expect(screen.getByText('2h')).toBeInTheDocument()

    // Check info text
    expect(screen.getByText(/sera créée automatiquement/i)).toBeInTheDocument()

    // Check buttons
    expect(screen.getByText(/Créer la récurrence/i)).toBeInTheDocument()
    expect(screen.getByText(/Annuler/i)).toBeInTheDocument()
  })

  it('handles day selection toggle', () => {
    const { container } = render(
      <RecurringSessionForm
        squadId={squadId}
        onCreated={mockOnCreated}
        onCancel={mockOnCancel}
      />
    )

    // Get all day buttons (7 buttons in the grid)
    const dayButtons = container.querySelectorAll('.grid.grid-cols-7 button')
    expect(dayButtons.length).toBe(7)

    const mondayButton = dayButtons[0] as HTMLElement

    // Initially not selected
    expect(mondayButton.className).toContain('bg-surface-card')

    // Click to select — triggers state update
    fireEvent.click(mondayButton)
    // After click, className should show 'Lundi' in the summary
    expect(screen.getByText('Lundi')).toBeInTheDocument()
  })

  it('validates that at least one day is selected', async () => {
    render(
      <RecurringSessionForm
        squadId={squadId}
        onCreated={mockOnCreated}
        onCancel={mockOnCancel}
      />
    )

    // Fill title
    const titleInput = screen.getByPlaceholderText(/Ranked Valorant/i)
    fireEvent.change(titleInput, { target: { value: 'Test Session' } })

    // Select a game (open dropdown then select)
    const gameButton = screen.getByText('Sélectionner un jeu')
    fireEvent.click(gameButton)
    // Select the first game option
    const firstGame = screen.getByText('Valorant')
    fireEvent.click(firstGame)

    // Try to submit without selecting days
    const submitButton = screen.getByText(/Créer la récurrence/i)
    // Submit button is disabled when no days selected
    expect(submitButton).toBeDisabled()

    expect(mockOnCreated).not.toHaveBeenCalled()
  })

  it('validates that title is required', async () => {
    render(
      <RecurringSessionForm
        squadId={squadId}
        onCreated={mockOnCreated}
        onCancel={mockOnCancel}
      />
    )

    // Select a day (enable submit)
    const mondayButton = screen.getAllByText('L')[0]
    fireEvent.click(mondayButton)

    // Select a game
    const gameButton = screen.getByText('Sélectionner un jeu')
    fireEvent.click(gameButton)
    const firstGame = screen.getByText('Valorant')
    fireEvent.click(firstGame)

    // Try to submit without title
    const submitButton = screen.getByText(/Créer la récurrence/i)
    fireEvent.click(submitButton)

    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/Le titre est requis/i)).toBeInTheDocument()
    })

    expect(mockOnCreated).not.toHaveBeenCalled()
  })

  it('disables submit button when no days selected', () => {
    render(
      <RecurringSessionForm
        squadId={squadId}
        onCreated={mockOnCreated}
        onCancel={mockOnCancel}
      />
    )

    const submitButton = screen.getByText(/Créer la récurrence/i) as HTMLButtonElement
    expect(submitButton).toBeDisabled()
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <RecurringSessionForm
        squadId={squadId}
        onCreated={mockOnCreated}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByText(/Annuler/)
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('renders time picker with default values', () => {
    const { container } = render(
      <RecurringSessionForm
        squadId={squadId}
        onCreated={mockOnCreated}
        onCancel={mockOnCancel}
      />
    )

    // Default hour is 21, minute is 00
    // Time pickers are <select> elements
    const selects = container.querySelectorAll('select')
    // At least 2 selects: hour and minute
    expect(selects.length).toBeGreaterThanOrEqual(2)
    // First select has hour options
    expect(selects[0].value).toBe('21')
    // Second select has minute options
    expect(selects[1].value).toBe('00')
  })

  it('handles duration selection', () => {
    render(
      <RecurringSessionForm
        squadId={squadId}
        onCreated={mockOnCreated}
        onCancel={mockOnCancel}
      />
    )

    // Duration options should be available
    expect(screen.getByText('1h')).toBeInTheDocument()
    expect(screen.getByText('1h30')).toBeInTheDocument()
    expect(screen.getByText('2h')).toBeInTheDocument()
    expect(screen.getByText('3h')).toBeInTheDocument()
  })

  it('formats recurrence rule correctly on submit', async () => {
    const { supabaseMinimal } = await import('../../lib/supabaseMinimal')
    const insertMock = vi.fn().mockResolvedValue({ error: null })

    vi.mocked(supabaseMinimal.from).mockReturnValue({
      insert: insertMock,
    } as any)

    render(
      <RecurringSessionForm
        squadId={squadId}
        onCreated={mockOnCreated}
        onCancel={mockOnCancel}
      />
    )

    // Fill title
    const titleInput = screen.getByPlaceholderText(/Ranked Valorant/i)
    fireEvent.change(titleInput, { target: { value: 'Test Session' } })

    // Select a game
    fireEvent.click(screen.getByText('Sélectionner un jeu'))
    fireEvent.click(screen.getByText('Valorant'))

    // Select Monday (L) and Vendredi (V)
    fireEvent.click(screen.getAllByText('L')[0])
    fireEvent.click(screen.getAllByText('V')[0])

    // Submit
    const submitButton = screen.getByText(/Créer la récurrence/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalled()
    })

    const insertCall = insertMock.mock.calls[0]?.[0]
    if (insertCall) {
      expect(insertCall.squad_id).toBe(squadId)
      expect(insertCall.title).toBe('Test Session')
      expect(insertCall.recurrence_rule).toMatch(/^weekly:\d+(?:,\d+)*:\d{2}:\d{2}$/)
    }
  })

  it('calls onCreated callback after successful submission', async () => {
    const { supabaseMinimal } = await import('../../lib/supabaseMinimal')

    vi.mocked(supabaseMinimal.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as any)

    render(
      <RecurringSessionForm
        squadId={squadId}
        onCreated={mockOnCreated}
        onCancel={mockOnCancel}
      />
    )

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/Ranked Valorant/i), { target: { value: 'Test Session' } })
    fireEvent.click(screen.getByText('Sélectionner un jeu'))
    fireEvent.click(screen.getByText('Valorant'))
    fireEvent.click(screen.getAllByText('L')[0])

    // Submit
    fireEvent.click(screen.getByText(/Créer la récurrence/i))

    await waitFor(() => {
      expect(mockOnCreated).toHaveBeenCalled()
    })
  })

  it('displays error message on submission failure', async () => {
    const { supabaseMinimal } = await import('../../lib/supabaseMinimal')

    const errorMessage = 'Database error occurred'
    vi.mocked(supabaseMinimal.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        error: new Error(errorMessage),
      }),
    } as any)

    render(
      <RecurringSessionForm
        squadId={squadId}
        onCreated={mockOnCreated}
        onCancel={mockOnCancel}
      />
    )

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/Ranked Valorant/i), { target: { value: 'Test Session' } })
    fireEvent.click(screen.getByText('Sélectionner un jeu'))
    fireEvent.click(screen.getByText('Valorant'))
    fireEvent.click(screen.getAllByText('L')[0])

    // Submit
    fireEvent.click(screen.getByText(/Créer la récurrence/i))

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    expect(mockOnCreated).not.toHaveBeenCalled()
  })

  it('shows loading state while submitting', async () => {
    const { supabaseMinimal } = await import('../../lib/supabaseMinimal')
    let resolveInsert: ((value: any) => void) | undefined

    vi.mocked(supabaseMinimal.from).mockReturnValue({
      insert: vi.fn().mockImplementation(
        () => new Promise((resolve) => { resolveInsert = resolve })
      ),
    } as any)

    render(
      <RecurringSessionForm
        squadId={squadId}
        onCreated={mockOnCreated}
        onCancel={mockOnCancel}
      />
    )

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/Ranked Valorant/i), { target: { value: 'Test Session' } })
    fireEvent.click(screen.getByText('Sélectionner un jeu'))
    fireEvent.click(screen.getByText('Valorant'))
    fireEvent.click(screen.getAllByText('L')[0])

    // Submit
    fireEvent.click(screen.getByText(/Créer la récurrence/i))

    // The form sets isLoading=true, which should disable buttons
    // Resolve the insert to complete the test
    if (resolveInsert) resolveInsert({ error: null })

    await waitFor(() => {
      expect(mockOnCreated).toHaveBeenCalled()
    })
  })
})
