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

vi.mock('../../../components/ui', () => ({
  Button: ({ children, ...props }: any) => createElement('button', props, children),
  Card: ({ children, ...props }: any) => createElement('div', props, children),
  CardContent: ({ children, ...props }: any) => createElement('div', props, children),
  Badge: ({ children, ...props }: any) => createElement('span', props, children),
}))

import { SessionInfoCards, RsvpCounts, RsvpButtons, CheckinSection, ParticipantsList } from '../SessionDetailSections'

describe('SessionInfoCards', () => {
  it('renders without crashing', () => {
    const { container } = render(<SessionInfoCards dateInfo={{ day: 'Lundi', time: '21:00' }} durationMinutes={60} />)
    expect(container).toBeTruthy()
  })

  it('shows date and time', () => {
    render(<SessionInfoCards dateInfo={{ day: 'Lundi', time: '21:00' }} durationMinutes={60} />)
    expect(screen.getByText('Lundi')).toBeTruthy()
    expect(screen.getByText('21:00')).toBeTruthy()
  })
})

describe('RsvpCounts', () => {
  it('renders counts', () => {
    render(<RsvpCounts present={3} maybe={1} absent={2} />)
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
  })
})

describe('RsvpButtons', () => {
  it('renders three buttons', () => {
    render(<RsvpButtons myRsvp={undefined} rsvpLoading={null} onRsvp={vi.fn()} />)
    expect(screen.getByText('Présent')).toBeTruthy()
    expect(screen.getByText('Peut-être')).toBeTruthy()
    expect(screen.getByText('Absent')).toBeTruthy()
  })
})

describe('CheckinSection', () => {
  it('renders check-in button', () => {
    render(<CheckinSection checkinLoading={false} onCheckin={vi.fn()} />)
    expect(screen.getByText('Je suis là !')).toBeTruthy()
  })
})

describe('ParticipantsList', () => {
  it('renders empty message when no rsvps', () => {
    render(<ParticipantsList rsvps={[]} checkins={[]} />)
    expect(screen.getByText("Aucune réponse pour l'instant")).toBeTruthy()
  })

  it('renders participants', () => {
    const rsvps = [{ user_id: 'u1', response: 'present', profiles: { username: 'Player1' } }]
    render(<ParticipantsList rsvps={rsvps} checkins={[]} />)
    expect(screen.getByText('Player1')).toBeTruthy()
  })
})
