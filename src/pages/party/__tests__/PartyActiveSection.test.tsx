import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
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

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
  Button: ({ children, ...props }: any) => createElement('button', props, children),
}))

vi.mock('../../../hooks/useVoiceChat', () => ({
  useVoiceChatStore: vi.fn().mockReturnValue({
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
  ParticipantAvatar: ({ username }: any) => createElement('span', {}, username),
}))

import { ActivePartySection } from '../PartyActiveSection'

describe('ActivePartySection', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <ActivePartySection
        squad={{ id: 's1', name: 'Test Squad', game: 'Valorant' }}
        onLeave={vi.fn()}
        currentUserId="user-1"
      />
    )
    expect(container).toBeTruthy()
  })
})
