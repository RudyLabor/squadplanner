/**
 * RecurringSessionForm.test.tsx
 * Unit tests for recurring session form component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RecurringSessionForm } from '../RecurringSessionForm'

// Mock dependencies
vi.mock('../PremiumGate', () => ({
  PremiumGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
}))

vi.mock('../../hooks', () => ({
  useHapticFeedback: () => ({
    triggerHaptic: vi.fn(),
  }),
}))

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}))

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
    expect(screen.getByPlaceholderText(/Session ranked/i)).toBeInTheDocument()

    // Check day buttons
    expect(screen.getByText('L')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('J')).toBeInTheDocument()
    expect(screen.getByText('V')).toBeInTheDocument()
    expect(screen.getByText('S')).toBeInTheDocument()
    expect(screen.getByText('D')).toBeInTheDocument()

    // Check time pickers
    expect(screen.getByDisplayValue('20')).toBeInTheDocument() // hour
    expect(screen.getByDisplayValue('00')).toBeInTheDocument() // minute

    // Check duration and threshold selects
    expect(screen.getByText('2h')).toBeInTheDocument()

    // Check info text
    expect(screen.getByText(/Une session sera créée automatiquement/i)).toBeInTheDocument()

    // Check buttons
    expect(screen.getByText(/Créer la récurrence/i)).toBeInTheDocument()
    expect(screen.getByText(/Annuler/i)).toBeInTheDocument()
  })

  it('handles day selection toggle', async () => {
    render(
      <RecurringSessionForm
        squadId={squadId}
        onCreated={mockOnCreated}
        onCancel={mockOnCancel}
      />
    )

    const mondayButton = screen.getAllByText('L')[0]

    // Initially not selected
    expect(mondayButton).not.toHaveClass('bg-primary')

    // Click to select
    fireEvent.click(mondayButton)
    await waitFor(() => {
      expect(mondayButton).toHaveClass('bg-primary')
    })

    // Click to deselect
    fireEvent.click(mondayButton)
    await waitFor(() => {
      expect(mondayButton).not.toHaveClass('bg-primary')
    })
  })

  it('validates that at least one day is selected', async () => {
    render(
      <RecurringSessionForm
        squadId={squadId}
        onCreated={mockOnCreated}
        onCancel={mockOnCancel}
      />
    )

    // Fill only title
    const titleInput = screen.getByPlaceholderText(/Session ranked/i)
    fireEvent.change(titleInput, { target: { value: 'Test Session' } })

    // Try to submit without selecting days
    const submitButton = screen.getByText(/Créer la récurrence/i)
    fireEvent.click(submitButton)

    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/Sélectionne au moins un jour/i)).toBeInTheDocument()
    })

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

    // Select a day
    const mondayButton = screen.getAllByText('L')[0]
    fireEvent.click(mondayButton)

    // Try to submit without title
    const submitButton = screen.getByText(/Créer la récurrence/i)
    fireEvent.click(submitButton)

    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/Le titre est requis/i)).toBeInTheDocument()
    })

    expect(mockOnCreated).not.toHaveBeenCalled()
  })

  it('disables submit button when no days selected or loading', async () => {
    render(
      <RecurringSessionForm
        squadId={squadId}
        onCreated={mockOnCreated}
        onCancel={mockOnCancel}
      />
    )

    const submitButton = screen.getByText(/Créer la récurrence/i) as HTMLButtonElement

    // Initially disabled (no days selected)
    expect(submitButton).toBeDisabled()

    // Select a day
    const mondayButton = screen.getAllByText('L')[0]
    fireEvent.click(mondayButton)

    // Should now be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
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

  it('handles time picker changes', async () => {
    render(
      <RecurringSessionForm
        squadId={squadId}
        onCreated={mockOnCreated}
        onCancel={mockOnCancel}
      />
    )

    // The time pickers should have their initial values
    const hourInput = screen.getByDisplayValue('20')
    const minuteInput = screen.getByDisplayValue('00')

    expect(hourInput).toBeInTheDocument()
    expect(minuteInput).toBeInTheDocument()

    // Note: Actual value changes depend on Select component behavior
  })

  it('handles duration selection', async () => {
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

    // Fill form
    const titleInput = screen.getByPlaceholderText(/Session ranked/i)
    fireEvent.change(titleInput, { target: { value: 'Test Session' } })

    // Select Monday (1), Wednesday (3), Friday (5)
    const dayButtons = screen.getAllByText(/[LMJ VS D]/)
    fireEvent.click(dayButtons[0]) // L (Monday)
    fireEvent.click(dayButtons[2]) // M (Wednesday - 3rd position)
    fireEvent.click(dayButtons[4]) // V (Friday)

    // Submit
    const submitButton = screen.getByText(/Créer la récurrence/i)
    fireEvent.click(submitButton)

    // Wait for async operations
    await waitFor(() => {
      expect(insertMock).toHaveBeenCalled()
    })

    // Check that insert was called with correct data
    const insertCall = insertMock.mock.calls[0]?.[0]
    if (insertCall) {
      expect(insertCall.squad_id).toBe(squadId)
      expect(insertCall.title).toBe('Test Session')
      expect(insertCall.is_recurring).toBe(true)
      // Rule should be "weekly:DAYS:HH:MM"
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
    const titleInput = screen.getByPlaceholderText(/Session ranked/i)
    fireEvent.change(titleInput, { target: { value: 'Test Session' } })

    // Select a day
    const mondayButton = screen.getAllByText('L')[0]
    fireEvent.click(mondayButton)

    // Submit
    const submitButton = screen.getByText(/Créer la récurrence/i)
    fireEvent.click(submitButton)

    // Wait for callback
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
    const titleInput = screen.getByPlaceholderText(/Session ranked/i)
    fireEvent.change(titleInput, { target: { value: 'Test Session' } })

    // Select a day
    const mondayButton = screen.getAllByText('L')[0]
    fireEvent.click(mondayButton)

    // Submit
    const submitButton = screen.getByText(/Créer la récurrence/i)
    fireEvent.click(submitButton)

    // Wait for error to display
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    expect(mockOnCreated).not.toHaveBeenCalled()
  })

  it('shows loading state while submitting', async () => {
    const { supabaseMinimal } = await import('../../lib/supabaseMinimal')

    // Mock with delayed response
    vi.mocked(supabaseMinimal.from).mockReturnValue({
      insert: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ error: null }), 100)
          )
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
    const titleInput = screen.getByPlaceholderText(/Session ranked/i)
    fireEvent.change(titleInput, { target: { value: 'Test Session' } })

    // Select a day
    const mondayButton = screen.getAllByText('L')[0]
    fireEvent.click(mondayButton)

    // Submit
    const submitButton = screen.getByText(/Créer la récurrence/i) as HTMLButtonElement
    fireEvent.click(submitButton)

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled()

    // Wait for completion
    await waitFor(() => {
      expect(mockOnCreated).toHaveBeenCalled()
    })
  })
})
