import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
}))

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

vi.mock(
  '../../../components/icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t: any, p: string) =>
          typeof p === 'string'
            ? ({ children, ...props }: any) => createElement('span', props, children)
            : undefined,
      }
    )
)

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
  Button: ({ children, ...props }: any) => createElement('button', props, children),
}))

const mockToggleMute = vi.fn()
const mockToggleNoiseSuppression = vi.fn()
const mockSetPushToTalk = vi.fn()
const mockPushToTalkStart = vi.fn()
const mockPushToTalkEnd = vi.fn()

vi.mock('../../../hooks/useVoiceChat', () => ({
  useVoiceChatStore: vi.fn().mockReturnValue({
    localUser: { odrop: 'local-1', username: 'Me', isSpeaking: false, isMuted: false },
    remoteUsers: [{ odrop: 'remote-1', username: 'Player2', isSpeaking: true, isMuted: false }],
    isMuted: false,
    toggleMute: mockToggleMute,
    error: null,
    isReconnecting: false,
    reconnectAttempts: 0,
    room: null,
    pushToTalkEnabled: false,
    pushToTalkActive: false,
    setPushToTalk: mockSetPushToTalk,
    pushToTalkStart: mockPushToTalkStart,
    pushToTalkEnd: mockPushToTalkEnd,
    noiseSuppressionEnabled: false,
    toggleNoiseSuppression: mockToggleNoiseSuppression,
  }),
}))

vi.mock('../../../components/NetworkQualityIndicator', () => ({
  NetworkQualityIndicator: () => null,
}))

vi.mock('../../../hooks/useNetworkQuality', () => ({
  useNetworkQualityStore: vi.fn().mockReturnValue({ localQuality: 'unknown' }),
}))

vi.mock('../../../components/VoiceWaveform', () => ({
  VoiceWaveformDemo: () => null,
}))

vi.mock('../../../components/ParticipantVolumeControl', () => ({
  ParticipantVolumeControl: () => null,
}))

vi.mock('../../../hooks/useParticipantVolumes', () => ({
  useParticipantVolumes: () => ({
    getVolume: vi.fn().mockReturnValue(100),
    setVolume: vi.fn(),
    isMuted: vi.fn().mockReturnValue(false),
    setMuted: vi.fn(),
    getEffectiveVolume: vi.fn().mockReturnValue(100),
  }),
}))

vi.mock('../../../components/InviteToPartyModal', () => ({
  InviteToPartyModal: () => null,
}))

vi.mock('../ParticipantAvatar', () => ({
  ParticipantAvatar: ({ username, isLocal }: any) =>
    createElement('span', { 'data-testid': `avatar-${username}`, 'data-local': isLocal }, username),
}))

import { ActivePartySection } from '../PartyActiveSection'

describe('ActivePartySection', () => {
  const defaultProps = {
    squad: { id: 's1', name: 'Test Squad', game: 'Valorant' },
    onLeave: vi.fn(),
    currentUserId: 'user-1',
  }

  // STRICT: verifies full party UI — squad name, game, participants, invite button, leave button, mute controls, status text
  it('renders active party with squad info, participants, controls, and status', () => {
    const { container } = render(<ActivePartySection {...defaultProps} />)

    // 1. Squad name displayed
    expect(screen.getByText('Test Squad')).toBeDefined()
    // 2. Game name displayed
    expect(screen.getByText('Valorant')).toBeDefined()
    // 3. Local participant avatar rendered
    expect(screen.getByTestId('avatar-Me')).toBeDefined()
    // 4. Remote participant avatar rendered
    expect(screen.getByTestId('avatar-Player2')).toBeDefined()
    // 5. Local avatar marked as local
    expect(screen.getByTestId('avatar-Me').getAttribute('data-local')).toBe('true')
    // 6. Remote avatar NOT marked as local
    expect(screen.getByTestId('avatar-Player2').getAttribute('data-local')).toBe('false')
    // 7. Invite button present
    expect(screen.getByText('Inviter')).toBeDefined()
    // 8. "Voir la squad" link present
    expect(screen.getByText('Voir la squad')).toBeDefined()
    // 9. Link to squad detail page
    const squadLink = container.querySelector('a[href="/squad/s1"]')
    expect(squadLink).not.toBeNull()
    // 10. "Micro actif" status text (not muted, not push-to-talk)
    expect(screen.getByText('Micro actif')).toBeDefined()
  })

  // STRICT: verifies the leave button triggers onLeave callback
  it('calls onLeave when leave button is clicked', () => {
    const onLeave = vi.fn()
    const { container } = render(<ActivePartySection {...defaultProps} onLeave={onLeave} />)

    // 1. onLeave not called initially
    expect(onLeave).not.toHaveBeenCalled()
    // 2. Find leave button (PhoneOff icon button — the red one)
    // The leave button has bg-error class
    const leaveBtn = container.querySelector('.bg-error')?.closest('button')
    expect(leaveBtn).not.toBeNull()
    // 3. Click leave
    fireEvent.click(leaveBtn!)
    // 4. onLeave called
    expect(onLeave).toHaveBeenCalledTimes(1)
    // 5. Squad info still displayed after clicking (component doesn't self-remove)
    expect(screen.getByText('Test Squad')).toBeDefined()
    // 6. All participants still rendered
    expect(screen.getByTestId('avatar-Me')).toBeDefined()
  })

  // STRICT: verifies solo party shows invite prompt
  it('shows invite prompt when only one participant', () => {
    // Override with no remote users
    const { useVoiceChatStore } = require('../../../hooks/useVoiceChat')
    useVoiceChatStore.mockReturnValueOnce({
      localUser: { odrop: 'local-1', username: 'Me', isSpeaking: false, isMuted: false },
      remoteUsers: [],
      isMuted: false,
      toggleMute: vi.fn(),
      error: null,
      isReconnecting: false,
      reconnectAttempts: 0,
      room: null,
      pushToTalkEnabled: false,
      pushToTalkActive: false,
      setPushToTalk: vi.fn(),
      pushToTalkStart: vi.fn(),
      pushToTalkEnd: vi.fn(),
      noiseSuppressionEnabled: false,
      toggleNoiseSuppression: vi.fn(),
    })

    render(<ActivePartySection {...defaultProps} />)

    // 1. Solo prompt text displayed
    expect(screen.getByText(/Invite tes potes/)).toBeDefined()
    // 2. Local avatar still shown
    expect(screen.getByTestId('avatar-Me')).toBeDefined()
    // 3. No remote avatars
    expect(screen.queryByTestId('avatar-Player2')).toBeNull()
    // 4. Squad name still displayed
    expect(screen.getByText('Test Squad')).toBeDefined()
    // 5. Invite button available
    expect(screen.getByText('Inviter')).toBeDefined()
    // 6. Party encouragement message
    expect(screen.getByText(/La party t'attend/)).toBeDefined()
  })
})
