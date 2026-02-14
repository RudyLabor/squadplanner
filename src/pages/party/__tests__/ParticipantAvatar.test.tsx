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

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

import { ParticipantAvatar } from '../ParticipantAvatar'

describe('ParticipantAvatar', () => {
  it('renders without crashing', () => {
    const { container } = render(<ParticipantAvatar username="TestUser" isSpeaking={false} isMuted={false} />)
    expect(container).toBeTruthy()
  })

  it('shows first letter of username', () => {
    render(<ParticipantAvatar username="TestUser" isSpeaking={false} isMuted={false} />)
    expect(screen.getByText('T')).toBeTruthy()
  })

  it('shows "Toi" for local user', () => {
    render(<ParticipantAvatar username="TestUser" isSpeaking={false} isMuted={false} isLocal />)
    expect(screen.getByText('Toi')).toBeTruthy()
  })

  it('shows username for remote user', () => {
    render(<ParticipantAvatar username="RemoteUser" isSpeaking={false} isMuted={false} />)
    expect(screen.getByText('RemoteUser')).toBeTruthy()
  })
})
