import { describe, it, expect, vi } from 'vitest'
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

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn().mockReturnValue({ current: null }),
}))

vi.mock('../ui', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => createElement('button', { onClick, disabled, ...props }, children),
}))

vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }),
}))

import { EditMessageModal } from '../EditMessageModal'

describe('EditMessageModal', () => {
  const defaultProps = {
    isOpen: true,
    message: { id: 'msg-1', content: 'Original message content' },
    onSave: vi.fn(),
    onClose: vi.fn(),
  }

  it('renders modal when open', () => {
    render(<EditMessageModal {...defaultProps} />)
    expect(screen.getByText('Modifier le message')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<EditMessageModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Modifier le message')).not.toBeInTheDocument()
  })

  it('displays original message in preview', () => {
    render(<EditMessageModal {...defaultProps} />)
    expect(screen.getByText('Message original')).toBeInTheDocument()
    // The text appears in both the preview and the textarea
    expect(screen.getAllByText('Original message content').length).toBeGreaterThanOrEqual(1)
  })

  it('renders textarea with message content', () => {
    render(<EditMessageModal {...defaultProps} />)
    const textarea = screen.getByDisplayValue('Original message content')
    expect(textarea).toBeInTheDocument()
  })

  it('renders close button with aria-label', () => {
    render(<EditMessageModal {...defaultProps} />)
    expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
  })

  it('renders Annuler and Sauvegarder buttons', () => {
    render(<EditMessageModal {...defaultProps} />)
    expect(screen.getByText('Annuler')).toBeInTheDocument()
    expect(screen.getByText('Sauvegarder')).toBeInTheDocument()
  })

  it('shows keyboard shortcut hint', () => {
    render(<EditMessageModal {...defaultProps} />)
    expect(screen.getByText(/Ctrl\+Entrée/)).toBeInTheDocument()
  })

  it('has dialog role', () => {
    render(<EditMessageModal {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
