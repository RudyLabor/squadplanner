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

vi.mock('../../hooks/useUserStatus', () => ({
  useUserStatusStore: vi.fn().mockReturnValue({
    customStatus: null,
    gameStatus: null,
    setCustomStatus: vi.fn().mockResolvedValue(undefined),
    setGameStatus: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('../../hooks/useSquads', () => ({
  useSquadsStore: vi.fn().mockReturnValue({ squads: [{ id: 'sq-1', name: 'TestSquad', game: 'Valorant' }] }),
}))

vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }),
}))

import { CustomStatusModal } from '../CustomStatusModal'

describe('CustomStatusModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  }

  it('renders modal when open', () => {
    render(<CustomStatusModal {...defaultProps} />)
    expect(screen.getByText('Définir un statut')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<CustomStatusModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Définir un statut')).not.toBeInTheDocument()
  })

  it('renders emoji picker area', () => {
    render(<CustomStatusModal {...defaultProps} />)
    expect(screen.getByText('Statut personnalisé')).toBeInTheDocument()
  })

  it('renders status text input', () => {
    render(<CustomStatusModal {...defaultProps} />)
    expect(screen.getByPlaceholderText('Que fais-tu ?')).toBeInTheDocument()
  })

  it('renders duration options', () => {
    render(<CustomStatusModal {...defaultProps} />)
    expect(screen.getByText('1 heure')).toBeInTheDocument()
    expect(screen.getByText('4 heures')).toBeInTheDocument()
    expect(screen.getByText('Ne pas effacer')).toBeInTheDocument()
  })

  it('renders game input', () => {
    render(<CustomStatusModal {...defaultProps} />)
    expect(screen.getByPlaceholderText('Ex: Valorant, League of Legends...')).toBeInTheDocument()
  })

  it('renders Enregistrer button', () => {
    render(<CustomStatusModal {...defaultProps} />)
    expect(screen.getByText('Enregistrer')).toBeInTheDocument()
  })

  it('renders Annuler button', () => {
    render(<CustomStatusModal {...defaultProps} />)
    expect(screen.getByText('Annuler')).toBeInTheDocument()
  })

  it('has close button with aria-label', () => {
    render(<CustomStatusModal {...defaultProps} />)
    expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
  })
})
