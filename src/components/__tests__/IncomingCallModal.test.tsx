import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

vi.mock('../../hooks/useVoiceCall', () => ({
  useVoiceCallStore: vi.fn().mockReturnValue({
    status: 'idle',
    caller: null,
    acceptCall: vi.fn(),
    rejectCall: vi.fn(),
  }),
}))

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn().mockReturnValue({ current: null }),
}))

vi.mock('../../hooks/useRingtone', () => ({
  useRingtone: vi.fn(),
}))

vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
}))

import { IncomingCallModal } from '../IncomingCallModal'
import { useVoiceCallStore } from '../../hooks/useVoiceCall'

const mockedUseVoiceCallStore = vi.mocked(useVoiceCallStore)

describe('IncomingCallModal', () => {
  it('returns null when status is idle', () => {
    const { container } = render(<IncomingCallModal />)
    expect(container.firstChild).toBeNull()
  })

  it('renders when status is ringing', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'ringing',
      caller: { username: 'Alice', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    expect(screen.getByText('Appel de Alice')).toBeInTheDocument()
    expect(screen.getByText('Appel entrant...')).toBeInTheDocument()
  })

  it('renders accept and reject buttons when ringing', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'ringing',
      caller: { username: 'Bob', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    expect(screen.getByLabelText("Accepter l'appel")).toBeInTheDocument()
    expect(screen.getByLabelText("Refuser l'appel")).toBeInTheDocument()
  })

  it('renders missed status text', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'missed',
      caller: { username: 'Charlie', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    expect(screen.getByText('Appel manqué')).toBeInTheDocument()
  })

  it('has dialog role for accessibility', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'ringing',
      caller: { username: 'Dave', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
