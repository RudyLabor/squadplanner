import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageViewer } from '../ImageViewer'
import { createElement, forwardRef } from 'react'

Element.prototype.scrollIntoView = vi.fn()

function makeMotionProxy() {
  const cache = new Map<string, any>()
  return new Proxy({}, {
    get: (_t: any, p: string) => {
      if (typeof p !== 'string') return undefined
      if (!cache.has(p)) {
        const comp = forwardRef(({ children, ...r }: any, ref: any) => createElement(p, { ...r, ref }, children))
        comp.displayName = `motion.${p}`
        cache.set(p, comp)
      }
      return cache.get(p)
    },
  })
}

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
  m: makeMotionProxy(),
  motion: makeMotionProxy(),
}))

vi.mock('../viewer/ViewerToolbar', () => ({
  ViewerToolbar: ({ alt, scale, onZoomIn, onZoomOut, onRotate, onDownload, onClose }: any) =>
    createElement('div', { 'data-testid': 'viewer-toolbar' },
      createElement('span', {}, `${Math.round(scale * 100)}%`),
      createElement('span', {}, alt),
      createElement('button', { onClick: onZoomIn, 'aria-label': 'Zoomer' }),
      createElement('button', { onClick: onZoomOut, 'aria-label': 'Dézoomer' }),
      createElement('button', { onClick: onRotate, 'aria-label': 'Pivoter' }),
      createElement('button', { onClick: onDownload, 'aria-label': 'Télécharger' }),
      createElement('button', { onClick: onClose, 'aria-label': 'Fermer' }),
    ),
}))

describe('ImageViewer', () => {
  // =========================================================================
  // Visibility / open state
  // =========================================================================
  describe('visibility', () => {
    it('does not render when isOpen=false', () => {
      render(<ImageViewer src="test.jpg" isOpen={false} onClose={() => {}} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders dialog when isOpen=true', () => {
      render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('sets aria-modal=true on dialog', () => {
      render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    })

    it('sets aria-label with alt text on dialog', () => {
      render(<ImageViewer src="test.jpg" alt="Screenshot" isOpen onClose={() => {}} />)
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Image viewer: Screenshot')
    })

    it('uses default alt "Image" when none provided', () => {
      render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Image viewer: Image')
    })
  })

  // =========================================================================
  // Image rendering
  // =========================================================================
  describe('image rendering', () => {
    it('renders image with correct src', () => {
      render(<ImageViewer src="https://example.com/photo.jpg" alt="Photo" isOpen onClose={() => {}} />)
      const img = screen.getByAltText('Photo')
      expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
    })

    it('renders image with correct alt text', () => {
      render(<ImageViewer src="test.jpg" alt="My image" isOpen onClose={() => {}} />)
      expect(screen.getByAltText('My image')).toBeInTheDocument()
    })

    it('sets draggable=false on image', () => {
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)
      expect(screen.getByAltText('Photo')).toHaveAttribute('draggable', 'false')
    })

    it('renders image with initial transform at scale 1', () => {
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)
      const img = screen.getByAltText('Photo')
      expect(img.style.transform).toContain('scale(1)')
      expect(img.style.transform).toContain('rotate(0deg)')
    })
  })

  // =========================================================================
  // Toolbar
  // =========================================================================
  describe('toolbar', () => {
    it('renders toolbar with zoom controls', () => {
      render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
      expect(screen.getByLabelText('Zoomer')).toBeInTheDocument()
      expect(screen.getByLabelText('Dézoomer')).toBeInTheDocument()
    })

    it('renders rotate button', () => {
      render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
      expect(screen.getByLabelText('Pivoter')).toBeInTheDocument()
    })

    it('renders download button', () => {
      render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
      expect(screen.getByLabelText('Télécharger')).toBeInTheDocument()
    })

    it('renders close button', () => {
      render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
      expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
    })

    it('displays initial scale as 100%', () => {
      render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<ImageViewer src="test.jpg" isOpen onClose={onClose} />)
      await user.click(screen.getByLabelText('Fermer'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  // =========================================================================
  // Zoom via toolbar
  // =========================================================================
  describe('toolbar zoom', () => {
    it('zooms in via toolbar button', async () => {
      const user = userEvent.setup()
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)
      await user.click(screen.getByLabelText('Zoomer'))
      expect(screen.getByText('125%')).toBeInTheDocument()
      const img = screen.getByAltText('Photo')
      expect(img.style.transform).toContain('scale(1.25)')
    })

    it('zooms out via toolbar button', async () => {
      const user = userEvent.setup()
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)
      // First zoom in, then zoom out
      await user.click(screen.getByLabelText('Zoomer'))
      expect(screen.getByText('125%')).toBeInTheDocument()
      await user.click(screen.getByLabelText('Dézoomer'))
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('rotates via toolbar button', async () => {
      const user = userEvent.setup()
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)
      await user.click(screen.getByLabelText('Pivoter'))
      const img = screen.getByAltText('Photo')
      expect(img.style.transform).toContain('rotate(90deg)')
    })

    it('rotates cumulatively', async () => {
      const user = userEvent.setup()
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)
      await user.click(screen.getByLabelText('Pivoter'))
      await user.click(screen.getByLabelText('Pivoter'))
      const img = screen.getByAltText('Photo')
      expect(img.style.transform).toContain('rotate(180deg)')
    })
  })

  // =========================================================================
  // Keyboard shortcuts
  // =========================================================================
  describe('keyboard shortcuts', () => {
    it('calls onClose on Escape key', () => {
      const onClose = vi.fn()
      render(<ImageViewer src="test.jpg" isOpen onClose={onClose} />)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('zooms in on + key', () => {
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)
      fireEvent.keyDown(document, { key: '+' })
      expect(screen.getByText('125%')).toBeInTheDocument()
    })

    it('zooms in on = key', () => {
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)
      fireEvent.keyDown(document, { key: '=' })
      expect(screen.getByText('125%')).toBeInTheDocument()
    })

    it('zooms out on - key', () => {
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)
      // zoom in first, then zoom out
      fireEvent.keyDown(document, { key: '+' })
      fireEvent.keyDown(document, { key: '-' })
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('rotates on r key', () => {
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)
      fireEvent.keyDown(document, { key: 'r' })
      const img = screen.getByAltText('Photo')
      expect(img.style.transform).toContain('rotate(90deg)')
    })

    it('resets all transforms on 0 key', () => {
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)
      // Zoom in and rotate first
      fireEvent.keyDown(document, { key: '+' })
      fireEvent.keyDown(document, { key: 'r' })
      // Now reset
      fireEvent.keyDown(document, { key: '0' })
      expect(screen.getByText('100%')).toBeInTheDocument()
      const img = screen.getByAltText('Photo')
      expect(img.style.transform).toContain('scale(1)')
      expect(img.style.transform).toContain('rotate(0deg)')
    })

    it('does not respond to keys when closed', () => {
      const onClose = vi.fn()
      render(<ImageViewer src="test.jpg" isOpen={false} onClose={onClose} />)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onClose).not.toHaveBeenCalled()
    })

    it('clamps zoom to max 5x', () => {
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)
      // Press + many times to hit max
      for (let i = 0; i < 20; i++) {
        fireEvent.keyDown(document, { key: '+' })
      }
      expect(screen.getByText('500%')).toBeInTheDocument()
    })

    it('clamps zoom to min 0.25x', () => {
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)
      // Press - many times to hit min
      for (let i = 0; i < 20; i++) {
        fireEvent.keyDown(document, { key: '-' })
      }
      expect(screen.getByText('25%')).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Backdrop click
  // =========================================================================
  describe('backdrop click', () => {
    it('calls onClose when clicking backdrop (currentTarget === target)', () => {
      const onClose = vi.fn()
      render(<ImageViewer src="test.jpg" isOpen onClose={onClose} />)
      const dialog = screen.getByRole('dialog')
      // Fire click directly on the dialog (backdrop)
      fireEvent.click(dialog)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose when clicking on the image', () => {
      const onClose = vi.fn()
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={onClose} />)
      const img = screen.getByAltText('Photo')
      fireEvent.click(img)
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // Double click zoom
  // =========================================================================
  describe('double click', () => {
    it('zooms to 2.5x on double click when at 1x', () => {
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)
      const img = screen.getByAltText('Photo')
      fireEvent.doubleClick(img.parentElement!)
      expect(screen.getByText('250%')).toBeInTheDocument()
    })

    it('resets to 1x on double click when zoomed in', () => {
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)
      const img = screen.getByAltText('Photo')
      // First double click zooms to 2.5x
      fireEvent.doubleClick(img.parentElement!)
      expect(screen.getByText('250%')).toBeInTheDocument()
      // Second double click resets to 1x
      fireEvent.doubleClick(img.parentElement!)
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Mouse wheel zoom
  // =========================================================================
  describe('wheel zoom', () => {
    it('zooms in when scrolling up (negative deltaY)', () => {
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)
      const img = screen.getByAltText('Photo')
      fireEvent.wheel(img.parentElement!, { deltaY: -100 })
      expect(screen.getByText('115%')).toBeInTheDocument()
    })

    it('zooms out when scrolling down (positive deltaY)', () => {
      render(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)
      const img = screen.getByAltText('Photo')
      fireEvent.wheel(img.parentElement!, { deltaY: 100 })
      expect(screen.getByText('85%')).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Resetting state on re-open
  // =========================================================================
  describe('state reset on re-open', () => {
    it('resets scale, rotation, and position when re-opened', () => {
      const { rerender } = render(
        <ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />
      )
      // Zoom and rotate
      fireEvent.keyDown(document, { key: '+' })
      fireEvent.keyDown(document, { key: 'r' })
      expect(screen.getByText('125%')).toBeInTheDocument()

      // Close
      rerender(<ImageViewer src="test.jpg" alt="Photo" isOpen={false} onClose={() => {}} />)
      // Reopen
      rerender(<ImageViewer src="test.jpg" alt="Photo" isOpen onClose={() => {}} />)

      expect(screen.getByText('100%')).toBeInTheDocument()
      const img = screen.getByAltText('Photo')
      expect(img.style.transform).toContain('scale(1)')
      expect(img.style.transform).toContain('rotate(0deg)')
    })
  })

  // =========================================================================
  // Hint text
  // =========================================================================
  describe('hint text', () => {
    it('renders keyboard shortcuts hint for desktop', () => {
      render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
      expect(screen.getByText('Esc: fermer')).toBeInTheDocument()
      expect(screen.getByText('R: pivoter')).toBeInTheDocument()
      expect(screen.getByText('0: reset')).toBeInTheDocument()
    })

    it('renders touch hints for mobile', () => {
      render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
      expect(screen.getByText('Pincer: zoom')).toBeInTheDocument()
      expect(screen.getByText('Double-tap: zoom 2x')).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Download
  // =========================================================================
  describe('download', () => {
    it('fetches image on download click', async () => {
      const user = userEvent.setup()
      const mockBlob = new Blob(['test'])
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        blob: () => Promise.resolve(mockBlob),
      } as any)
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

      render(<ImageViewer src="https://example.com/image.png" alt="Download test" isOpen onClose={() => {}} />)
      await user.click(screen.getByLabelText('Télécharger'))

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith('https://example.com/image.png')
      })

      fetchSpy.mockRestore()
    })

    it('falls back to window.open when fetch fails', async () => {
      const user = userEvent.setup()
      const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('fail'))
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

      render(<ImageViewer src="https://example.com/image.png" isOpen onClose={() => {}} />)
      await user.click(screen.getByLabelText('Télécharger'))

      await vi.waitFor(() => {
        expect(openSpy).toHaveBeenCalledWith('https://example.com/image.png', '_blank')
      })

      fetchSpy.mockRestore()
      openSpy.mockRestore()
    })
  })
})
