import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageViewer } from '../ImageViewer'
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

describe('ImageViewer', () => {
  it('does not render when closed', () => {
    render(<ImageViewer src="test.jpg" isOpen={false} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders when open', () => {
    render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('has aria-modal=true', () => {
    render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('renders image with src', () => {
    render(<ImageViewer src="test.jpg" alt="Test image" isOpen onClose={() => {}} />)
    expect(screen.getByAltText('Test image')).toHaveAttribute('src', 'test.jpg')
  })

  it('renders toolbar controls', () => {
    render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
    expect(screen.getByLabelText('Zoomer')).toBeInTheDocument()
    expect(screen.getByLabelText('Dézoomer')).toBeInTheDocument()
    expect(screen.getByLabelText('Pivoter')).toBeInTheDocument()
    expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ImageViewer src="test.jpg" isOpen onClose={onClose} />)
    await user.click(screen.getByLabelText('Fermer'))
    expect(onClose).toHaveBeenCalled()
  })

  it('displays zoom percentage', () => {
    render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})
