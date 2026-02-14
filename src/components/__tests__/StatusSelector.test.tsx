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

  it('renders current status label', () => {
    render(createElement(StatusSelector))
    expect(screen.getByText('En ligne')).toBeDefined()
  })

  it('opens dropdown on click', () => {
    render(createElement(StatusSelector))
    const trigger = screen.getByLabelText('Statut: En ligne')
    fireEvent.click(trigger)
    expect(screen.getByText('Occupé')).toBeDefined()
    expect(screen.getByText('Ne pas déranger')).toBeDefined()
    expect(screen.getByText('Invisible')).toBeDefined()
  })

  it('calls setAvailability when status is selected', () => {
    render(createElement(StatusSelector))
    const trigger = screen.getByLabelText('Statut: En ligne')
    fireEvent.click(trigger)
    fireEvent.click(screen.getByText('Occupé'))
    expect(mockSetAvailability).toHaveBeenCalledWith('busy')
  })

  it('renders with aria-expanded attribute', () => {
    render(createElement(StatusSelector))
    const trigger = screen.getByLabelText('Statut: En ligne')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })
})
