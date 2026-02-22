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

vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), {
    getState: vi.fn().mockReturnValue({ locale: 'fr' }),
  }),
}))

import { CreatePollModal } from '../CreatePollModal'

describe('CreatePollModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onCreatePoll: vi.fn(),
  }

  it('renders modal when open', () => {
    render(<CreatePollModal {...defaultProps} />)
    expect(screen.getByText('Créer un sondage')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<CreatePollModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Créer un sondage')).not.toBeInTheDocument()
  })

  it('renders question input', () => {
    render(<CreatePollModal {...defaultProps} />)
    expect(screen.getByPlaceholderText('Pose ta question...')).toBeInTheDocument()
  })

  it('renders initial two option inputs', () => {
    render(<CreatePollModal {...defaultProps} />)
    expect(screen.getByPlaceholderText('Option 1')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Option 2')).toBeInTheDocument()
  })

  it('renders add option button', () => {
    render(<CreatePollModal {...defaultProps} />)
    expect(screen.getByText('Ajouter une option')).toBeInTheDocument()
  })

  it('calls onClose when Annuler is clicked', () => {
    const onClose = vi.fn()
    render(<CreatePollModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByText('Annuler'))
    expect(onClose).toHaveBeenCalled()
  })

  it('has disabled submit when form is incomplete', () => {
    render(<CreatePollModal {...defaultProps} />)
    const submitBtn = screen.getByText('Créer le sondage')
    expect(submitBtn).toBeDisabled()
  })

  it('renders close button with aria-label', () => {
    render(<CreatePollModal {...defaultProps} />)
    expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
  })

  it('has dialog role', () => {
    render(<CreatePollModal {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
