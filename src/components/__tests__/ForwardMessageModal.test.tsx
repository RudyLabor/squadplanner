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

vi.mock('../../hooks/useSquads', () => ({
  useSquadsStore: vi.fn().mockReturnValue({
    squads: [
      { id: 'sq-1', name: 'TestSquad', game: 'Valorant' },
      { id: 'sq-2', name: 'Squad2', game: 'LoL' },
    ],
    fetchSquads: vi.fn(),
  }),
}))

vi.mock('../../hooks/useMessages', () => ({
  useMessagesStore: vi.fn().mockReturnValue({
    sendMessage: vi.fn().mockResolvedValue({ error: null }),
  }),
}))

vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), {
    getState: vi.fn().mockReturnValue({ locale: 'fr' }),
  }),
}))

import { ForwardMessageModal } from '../ForwardMessageModal'

describe('ForwardMessageModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    messageContent: 'Hello world',
    senderUsername: 'Alice',
  }

  it('renders modal when open', () => {
    render(<ForwardMessageModal {...defaultProps} />)
    expect(screen.getByText('Transférer le message')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<ForwardMessageModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Transférer le message')).not.toBeInTheDocument()
  })

  it('displays message preview', () => {
    render(<ForwardMessageModal {...defaultProps} />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('displays sender name', () => {
    render(<ForwardMessageModal {...defaultProps} />)
    expect(screen.getByText('De Alice')).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<ForwardMessageModal {...defaultProps} />)
    expect(screen.getByPlaceholderText('Rechercher une squad...')).toBeInTheDocument()
  })

  it('renders squad list', () => {
    render(<ForwardMessageModal {...defaultProps} />)
    expect(screen.getByText('TestSquad')).toBeInTheDocument()
    expect(screen.getByText('Squad2')).toBeInTheDocument()
  })

  it('renders Annuler button', () => {
    render(<ForwardMessageModal {...defaultProps} />)
    expect(screen.getByText('Annuler')).toBeInTheDocument()
  })

  it('has close button with aria-label', () => {
    render(<ForwardMessageModal {...defaultProps} />)
    expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
  })

  it('has dialog role', () => {
    render(<ForwardMessageModal {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
