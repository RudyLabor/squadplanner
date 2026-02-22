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

vi.mock('../../hooks/useCustomStatus', () => ({
  useCustomStatus: vi.fn().mockReturnValue({
    currentStatus: null,
    setStatus: vi.fn(),
    clearStatus: vi.fn(),
    isUpdating: false,
  }),
  STATUS_PRESETS: [
    { emoji: '🎮', text: 'En jeu' },
    { emoji: '💤', text: 'AFK' },
    { emoji: '🔥', text: 'En feu' },
    { emoji: '📚', text: 'Occupe' },
  ],
  STATUS_DURATIONS: [
    { label: '30 min', minutes: 30 },
    { label: '1 heure', minutes: 60 },
    { label: '4 heures', minutes: 240 },
    { label: "Jusqu'a demain", minutes: null },
  ],
}))

vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), {
    getState: vi.fn().mockReturnValue({ locale: 'fr' }),
  }),
}))

import { CustomStatusPicker, StatusBadge } from '../CustomStatusPicker'

describe('CustomStatusPicker', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  }

  it('renders modal when open', () => {
    render(<CustomStatusPicker {...defaultProps} />)
    expect(screen.getByText('Définir un statut')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<CustomStatusPicker {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Définir un statut')).not.toBeInTheDocument()
  })

  it('renders status input', () => {
    render(<CustomStatusPicker {...defaultProps} />)
    expect(screen.getByPlaceholderText('Quel est ton statut ?')).toBeInTheDocument()
  })

  it('renders suggestions section', () => {
    render(<CustomStatusPicker {...defaultProps} />)
    expect(screen.getByText('Suggestions')).toBeInTheDocument()
  })

  it('renders preset options', () => {
    render(<CustomStatusPicker {...defaultProps} />)
    expect(screen.getByText('En jeu')).toBeInTheDocument()
    expect(screen.getByText('AFK')).toBeInTheDocument()
  })

  it('renders Enregistrer button', () => {
    render(<CustomStatusPicker {...defaultProps} />)
    expect(screen.getByText('Enregistrer')).toBeInTheDocument()
  })

  it('renders Annuler button', () => {
    render(<CustomStatusPicker {...defaultProps} />)
    expect(screen.getByText('Annuler')).toBeInTheDocument()
  })

  it('has close button with aria-label', () => {
    render(<CustomStatusPicker {...defaultProps} />)
    expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  it('renders text and emoji', () => {
    render(<StatusBadge emoji="🎮" text="En jeu" />)
    expect(screen.getByText('En jeu')).toBeInTheDocument()
    expect(screen.getByText('🎮')).toBeInTheDocument()
  })

  it('returns null when no text', () => {
    const { container } = render(<StatusBadge />)
    expect(container.firstChild).toBeNull()
  })

  it('renders without emoji', () => {
    render(<StatusBadge text="Busy" />)
    expect(screen.getByText('Busy')).toBeInTheDocument()
  })
})
