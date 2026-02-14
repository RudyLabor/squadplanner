import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { ViewerToolbar } from '../../viewer/ViewerToolbar'

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

vi.mock('../../../icons', () =>
  new Proxy({}, {
    get: (_t, name) =>
      typeof name === 'string'
        ? (props: any) => createElement('svg', { 'data-testid': `icon-${name}`, ...props })
        : undefined,
  })
)

describe('ViewerToolbar', () => {
  const baseProps = {
    alt: 'Test image',
    scale: 1,
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onRotate: vi.fn(),
    onDownload: vi.fn(),
    onClose: vi.fn(),
  }

  it('renders alt text', () => {
    render(<ViewerToolbar {...baseProps} />)
    expect(screen.getByText('Test image')).toBeDefined()
  })

  it('renders scale percentage', () => {
    render(<ViewerToolbar {...baseProps} scale={1.5} />)
    expect(screen.getByText('150%')).toBeDefined()
  })

  it('renders default 100% scale', () => {
    render(<ViewerToolbar {...baseProps} scale={1} />)
    expect(screen.getByText('100%')).toBeDefined()
  })

  it('calls onZoomIn when zoom in button is clicked', () => {
    const onZoomIn = vi.fn()
    render(<ViewerToolbar {...baseProps} onZoomIn={onZoomIn} />)
    fireEvent.click(screen.getByLabelText('Zoomer'))
    expect(onZoomIn).toHaveBeenCalled()
  })

  it('calls onZoomOut when zoom out button is clicked', () => {
    const onZoomOut = vi.fn()
    render(<ViewerToolbar {...baseProps} onZoomOut={onZoomOut} />)
    fireEvent.click(screen.getByLabelText('Dézoomer'))
    expect(onZoomOut).toHaveBeenCalled()
  })

  it('calls onRotate when rotate button is clicked', () => {
    const onRotate = vi.fn()
    render(<ViewerToolbar {...baseProps} onRotate={onRotate} />)
    fireEvent.click(screen.getByLabelText('Pivoter'))
    expect(onRotate).toHaveBeenCalled()
  })

  it('calls onDownload when download button is clicked', () => {
    const onDownload = vi.fn()
    render(<ViewerToolbar {...baseProps} onDownload={onDownload} />)
    fireEvent.click(screen.getByLabelText('Télécharger'))
    expect(onDownload).toHaveBeenCalled()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<ViewerToolbar {...baseProps} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Fermer'))
    expect(onClose).toHaveBeenCalled()
  })

  it('renders all toolbar icons', () => {
    render(<ViewerToolbar {...baseProps} />)
    expect(screen.getByTestId('icon-ZoomIn')).toBeDefined()
    expect(screen.getByTestId('icon-ZoomOut')).toBeDefined()
    expect(screen.getByTestId('icon-RotateCw')).toBeDefined()
    expect(screen.getByTestId('icon-Download')).toBeDefined()
    expect(screen.getByTestId('icon-X')).toBeDefined()
  })
})
