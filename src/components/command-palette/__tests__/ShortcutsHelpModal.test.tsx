import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { ShortcutsHelpModal } from '../ShortcutsHelpModal'

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
  '../../icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t, name) =>
          typeof name === 'string'
            ? (props: any) => createElement('svg', { 'data-testid': `icon-${name}`, ...props })
            : undefined,
      }
    )
)

describe('ShortcutsHelpModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <ShortcutsHelpModal isOpen={false} onClose={vi.fn()} shortcutKey="Ctrl" />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders shortcuts when open', () => {
    render(<ShortcutsHelpModal isOpen={true} onClose={vi.fn()} shortcutKey="Ctrl" />)
    expect(screen.getByText('Raccourcis clavier')).toBeDefined()
    expect(screen.getByText('Navigation')).toBeDefined()
    expect(screen.getByText('Global')).toBeDefined()
  })

  it('displays navigation shortcuts', () => {
    render(<ShortcutsHelpModal isOpen={true} onClose={vi.fn()} shortcutKey="Ctrl" />)
    expect(screen.getByText('Accueil')).toBeDefined()
    expect(screen.getByText('Squads')).toBeDefined()
    expect(screen.getByText('Messages')).toBeDefined()
    expect(screen.getByText('Party vocale')).toBeDefined()
  })

  it('displays shortcut key in global shortcuts', () => {
    render(<ShortcutsHelpModal isOpen={true} onClose={vi.fn()} shortcutKey="Ctrl" />)
    expect(screen.getByText('Ctrl K')).toBeDefined()
  })

  it('uses Mac shortcut key when passed', () => {
    render(<ShortcutsHelpModal isOpen={true} onClose={vi.fn()} shortcutKey="\u2318" />)
    expect(screen.getByText('\u2318 K')).toBeDefined()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<ShortcutsHelpModal isOpen={true} onClose={onClose} shortcutKey="Ctrl" />)
    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalled()
  })
})
