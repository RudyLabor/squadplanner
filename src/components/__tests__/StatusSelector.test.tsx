import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { useUserStatusStore } from '../../hooks/useUserStatus'

// Mock framer-motion
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
  m: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
  motion: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
}))

// Mock icons
vi.mock('../icons', () => ({
  Circle: (props: any) => createElement('svg', props),
  Minus: (props: any) => createElement('svg', props),
  BellOff: (props: any) => createElement('svg', props),
  Eye: (props: any) => createElement('svg', props),
  Gamepad2: (props: any) => createElement('svg', props),
}))

vi.mock('../../hooks/useUserStatus', () => ({
  useUserStatusStore: vi.fn().mockReturnValue({
    availability: 'online',
    setAvailability: vi.fn(),
    customStatus: null,
    gameStatus: null,
  }),
  AVAILABILITY_CONFIG: {
    online: { label: 'En ligne', color: '#22C55E', dotClass: 'bg-success' },
    busy: { label: 'Occupé', color: '#F59E0B', dotClass: 'bg-warning' },
    dnd: { label: 'Ne pas déranger', color: '#EF4444', dotClass: 'bg-error' },
    invisible: { label: 'Invisible', color: '#6B7280', dotClass: 'bg-text-quaternary' },
  },
}))

const mockedUseUserStatusStore = vi.mocked(useUserStatusStore)

import { StatusSelector } from '../StatusSelector'

describe('StatusSelector', () => {
  const mockSetAvailability = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseUserStatusStore.mockReturnValue({
      availability: 'online',
      setAvailability: mockSetAvailability,
      customStatus: null,
      gameStatus: null,
    } as any)
  })

  // STRICT: Verifies initial closed state — current status label, aria-label, aria-expanded=false, no dropdown options, button structure
  it('renders trigger button with correct status label, aria attributes, and closed dropdown', () => {
    render(createElement(StatusSelector))

    // 1. Current status label visible
    expect(screen.getByText('En ligne')).toBeInTheDocument()
    // 2. Aria-label includes status
    const trigger = screen.getByLabelText('Statut: En ligne')
    expect(trigger).toBeInTheDocument()
    // 3. aria-expanded is false when closed
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    // 4. Button type is "button"
    expect(trigger.getAttribute('type')).toBe('button')
    // 5. Dropdown options not visible
    expect(screen.queryByText('Occupé')).not.toBeInTheDocument()
    expect(screen.queryByText('Ne pas déranger')).not.toBeInTheDocument()
    expect(screen.queryByText('Invisible')).not.toBeInTheDocument()
    // 6. Trigger is a button element
    expect(trigger.tagName).toBe('BUTTON')
  })

  // STRICT: Verifies dropdown opening — all 4 status options visible, aria-expanded toggled, correct labels displayed
  it('opens dropdown with all status options and toggles aria-expanded', () => {
    render(createElement(StatusSelector))

    const trigger = screen.getByLabelText('Statut: En ligne')
    // 1. Click to open
    fireEvent.click(trigger)
    // 2. aria-expanded is now true
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    // 3. All 4 status options visible (En ligne appears twice: trigger + dropdown)
    expect(screen.getAllByText('En ligne').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Occupé')).toBeInTheDocument()
    expect(screen.getByText('Ne pas déranger')).toBeInTheDocument()
    expect(screen.getByText('Invisible')).toBeInTheDocument()
    // 4. No "Définir un statut" button (onOpenCustomStatus not provided)
    expect(screen.queryByText('Définir un statut')).not.toBeInTheDocument()
    // 5. Click again to close
    fireEvent.click(trigger)
    // 6. aria-expanded back to false
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  // STRICT: Verifies status selection — clicking an option calls setAvailability with correct value and closes dropdown
  it('calls setAvailability with correct value on status selection and closes dropdown', () => {
    render(createElement(StatusSelector))

    const trigger = screen.getByLabelText('Statut: En ligne')
    fireEvent.click(trigger)

    // 1. Click "Occupé"
    fireEvent.click(screen.getByText('Occupé'))
    // 2. setAvailability called with 'busy'
    expect(mockSetAvailability).toHaveBeenCalledWith('busy')
    // 3. Called exactly once
    expect(mockSetAvailability).toHaveBeenCalledTimes(1)
    // 4. Dropdown closed after selection (aria-expanded = false)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    // 5. Other options no longer visible (dropdown closed)
    expect(screen.queryByText('Ne pas déranger')).not.toBeInTheDocument()

    // 6. Open again and select another status
    fireEvent.click(trigger)
    fireEvent.click(screen.getByText('Ne pas déranger'))
    expect(mockSetAvailability).toHaveBeenCalledWith('dnd')
  })

  // STRICT: Verifies custom status display, game status display, and onOpenCustomStatus callback
  it('shows custom status, game status, and custom status button when provided', () => {
    const mockOnOpenCustom = vi.fn()
    mockedUseUserStatusStore.mockReturnValue({
      availability: 'online',
      setAvailability: mockSetAvailability,
      customStatus: { emoji: '🎯', text: 'Focusing' },
      gameStatus: { game: 'Valorant' },
    } as any)

    render(createElement(StatusSelector, { onOpenCustomStatus: mockOnOpenCustom }))

    // 1. Custom status shown in trigger (emoji + text)
    expect(screen.getByText(/🎯 Focusing/)).toBeInTheDocument()
    // 2. Open dropdown
    const trigger = screen.getByLabelText('Statut: En ligne')
    fireEvent.click(trigger)
    // 3. Game status visible in dropdown
    expect(screen.getByText('Valorant')).toBeInTheDocument()
    // 4. Custom status section in dropdown
    expect(screen.getByText('Focusing')).toBeInTheDocument()
    // 5. "Modifier le statut" button visible (since customStatus exists)
    expect(screen.getByText('Modifier le statut')).toBeInTheDocument()
    // 6. Click the custom status button
    fireEvent.click(screen.getByText('Modifier le statut'))
    expect(mockOnOpenCustom).toHaveBeenCalledTimes(1)
    // 7. Dropdown closes after clicking custom status button
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
})
