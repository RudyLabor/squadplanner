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
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { useRingtone } from '../../hooks/useRingtone'

const mockedUseVoiceCallStore = vi.mocked(useVoiceCallStore)
const mockedUseFocusTrap = vi.mocked(useFocusTrap)
const mockedUseRingtone = vi.mocked(useRingtone)

describe('IncomingCallModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'idle',
      caller: null,
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
  })

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

  // --- P1.1 Audit: ring animation states (missed, rejected) ---

  it('renders missed call status', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'missed',
      caller: { username: 'Eve', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    expect(screen.getByText('Appel manqué')).toBeInTheDocument()
    expect(screen.getByText('Appel de Eve')).toBeInTheDocument()
  })

  it('renders rejected call status', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'rejected',
      caller: { username: 'Frank', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    expect(screen.getByText('Appel refusé')).toBeInTheDocument()
    expect(screen.getByText('Appel de Frank')).toBeInTheDocument()
  })

  it('does not show accept/reject buttons for missed calls', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'missed',
      caller: { username: 'Grace', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    expect(screen.queryByLabelText("Accepter l'appel")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Refuser l'appel")).not.toBeInTheDocument()
  })

  it('does not show accept/reject buttons for rejected calls', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'rejected',
      caller: { username: 'Hank', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    expect(screen.queryByLabelText("Accepter l'appel")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Refuser l'appel")).not.toBeInTheDocument()
  })

  // --- P1.1 Audit: accept button calls acceptCall ---

  it('calls acceptCall when accept button is clicked', () => {
    const acceptCallMock = vi.fn()
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'ringing',
      caller: { username: 'Iris', avatar_url: null },
      acceptCall: acceptCallMock,
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    fireEvent.click(screen.getByLabelText("Accepter l'appel"))
    expect(acceptCallMock).toHaveBeenCalledTimes(1)
  })

  // --- P1.1 Audit: reject button calls rejectCall ---

  it('calls rejectCall when reject button is clicked', () => {
    const rejectCallMock = vi.fn()
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'ringing',
      caller: { username: 'Jack', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: rejectCallMock,
    } as any)
    render(<IncomingCallModal />)
    fireEvent.click(screen.getByLabelText("Refuser l'appel"))
    expect(rejectCallMock).toHaveBeenCalledTimes(1)
  })

  // --- P1.1 Audit: focus trap activation ---

  it('initializes focus trap with shouldShow=true when ringing', () => {
    const rejectCallMock = vi.fn()
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'ringing',
      caller: { username: 'Kate', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: rejectCallMock,
    } as any)
    render(<IncomingCallModal />)
    expect(mockedUseFocusTrap).toHaveBeenCalledWith(true, rejectCallMock)
  })

  it('initializes focus trap with shouldShow=true when missed', () => {
    const rejectCallMock = vi.fn()
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'missed',
      caller: { username: 'Leo', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: rejectCallMock,
    } as any)
    render(<IncomingCallModal />)
    expect(mockedUseFocusTrap).toHaveBeenCalledWith(true, rejectCallMock)
  })

  it('initializes focus trap with shouldShow=false when idle', () => {
    render(<IncomingCallModal />)
    expect(mockedUseFocusTrap).toHaveBeenCalledWith(false, expect.any(Function))
  })

  // --- P1.1 Audit: ringtone hook integration ---

  it('activates ringtone when status is ringing', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'ringing',
      caller: { username: 'Mia', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    expect(mockedUseRingtone).toHaveBeenCalledWith(true)
  })

  it('does not activate ringtone when status is missed', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'missed',
      caller: { username: 'Nick', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    expect(mockedUseRingtone).toHaveBeenCalledWith(false)
  })

  it('does not activate ringtone when status is idle', () => {
    render(<IncomingCallModal />)
    expect(mockedUseRingtone).toHaveBeenCalledWith(false)
  })

  // --- P1.1 Audit: status text changes per state ---

  it('shows "Appel entrant..." for ringing state', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'ringing',
      caller: { username: 'Olga', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    expect(screen.getByText('Appel entrant...')).toBeInTheDocument()
  })

  it('shows "Appel manqué" for missed state', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'missed',
      caller: { username: 'Paul', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    expect(screen.getByText('Appel manqué')).toBeInTheDocument()
  })

  it('shows "Appel refusé" for rejected state', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'rejected',
      caller: { username: 'Quinn', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    expect(screen.getByText('Appel refusé')).toBeInTheDocument()
  })

  // --- P1.1 Audit: returns null when caller is null ---

  it('returns null when caller is null even if status is ringing', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'ringing',
      caller: null,
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    const { container } = render(<IncomingCallModal />)
    expect(container.firstChild).toBeNull()
  })

  // --- P1.1 Audit: avatar display ---

  it('shows caller initial when no avatar_url', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'ringing',
      caller: { username: 'Zara', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    expect(screen.getByText('Z')).toBeInTheDocument()
  })

  it('shows avatar image when avatar_url is present', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'ringing',
      caller: { username: 'Rita', avatar_url: 'https://example.com/avatar.jpg' },
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    const img = screen.getByAltText('Rita')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  // --- P1.1 Audit: accessibility ---

  it('has aria-modal=true on dialog', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'ringing',
      caller: { username: 'Sam', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'incoming-call-title')
  })

  it('renders Accepter and Refuser labels visible on screen', () => {
    mockedUseVoiceCallStore.mockReturnValue({
      status: 'ringing',
      caller: { username: 'Tom', avatar_url: null },
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    } as any)
    render(<IncomingCallModal />)
    expect(screen.getByText('Accepter')).toBeInTheDocument()
    expect(screen.getByText('Refuser')).toBeInTheDocument()
  })
})
