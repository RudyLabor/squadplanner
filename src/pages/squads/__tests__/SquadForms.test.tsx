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
  Input: ({ label, ...props }: any) => createElement('div', {}, label ? createElement('label', {}, label) : null, createElement('input', props)),
}))

import { JoinSquadForm, CreateSquadForm } from '../SquadForms'

describe('JoinSquadForm', () => {
  const defaultProps = {
    show: true,
    inviteCode: '',
    onInviteCodeChange: vi.fn(),
    error: null,
    isLoading: false,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  }

  it('renders when shown', () => {
    render(<JoinSquadForm {...defaultProps} />)
    expect(screen.getByText('Rejoindre une squad')).toBeTruthy()
  })

  it('renders nothing when hidden', () => {
    const { container } = render(<JoinSquadForm {...defaultProps} show={false} />)
    expect(screen.queryByText('Rejoindre une squad')).toBeNull()
  })

  it('shows error when provided', () => {
    render(<JoinSquadForm {...defaultProps} error="Code invalide" />)
    expect(screen.getByText('Code invalide')).toBeTruthy()
  })
})

describe('CreateSquadForm', () => {
  const defaultProps = {
    show: true,
    name: '',
    onNameChange: vi.fn(),
    game: '',
    onGameChange: vi.fn(),
    error: null,
    isLoading: false,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  }

  it('renders when shown', () => {
    render(<CreateSquadForm {...defaultProps} />)
    expect(screen.getByText('Créer une squad')).toBeTruthy()
  })

  it('renders input labels', () => {
    render(<CreateSquadForm {...defaultProps} />)
    expect(screen.getByText('Nom de la squad')).toBeTruthy()
    expect(screen.getByText('Jeu principal')).toBeTruthy()
  })
})
