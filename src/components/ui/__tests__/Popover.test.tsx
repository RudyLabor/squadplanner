import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Popover } from '../Popover'
import { createElement, forwardRef } from 'react'

Element.prototype.scrollIntoView = vi.fn()

function makeMotionProxy() {
  const cache = new Map<string, any>()
  return new Proxy(
    {},
    {
      get: (_t: any, p: string) => {
        if (typeof p !== 'string') return undefined
        if (!cache.has(p)) {
          const comp = forwardRef(({ children, ...r }: any, ref: any) =>
            createElement(p, { ...r, ref }, children)
          )
          comp.displayName = `motion.${p}`
          cache.set(p, comp)
        }
        return cache.get(p)
      },
    }
  )
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

describe('Popover', () => {
  // =========================================================================
  // Basic rendering
  // =========================================================================
  describe('basic rendering', () => {
    it('renders trigger element', () => {
      render(
        <Popover trigger={<button>Open</button>}>
          <div>Content</div>
        </Popover>
      )
      expect(screen.getByText('Open')).toBeInTheDocument()
    })

    it('does not render popover content initially', () => {
      render(
        <Popover trigger={<button>Open</button>}>
          <div>Popover content</div>
        </Popover>
      )
      expect(screen.queryByText('Popover content')).not.toBeInTheDocument()
    })

    it('sets aria-haspopup=true on trigger wrapper', () => {
      render(
        <Popover trigger={<button>Open</button>}>
          <div>Content</div>
        </Popover>
      )
      const wrapper = screen.getByText('Open').closest('[aria-haspopup]')
      expect(wrapper).toHaveAttribute('aria-haspopup', 'true')
    })

    it('sets aria-expanded=false initially', () => {
      render(
        <Popover trigger={<button>Open</button>}>
          <div>Content</div>
        </Popover>
      )
      const wrapper = screen.getByText('Open').closest('[aria-expanded]')
      expect(wrapper).toHaveAttribute('aria-expanded', 'false')
    })
  })

  // =========================================================================
  // Click trigger mode (default)
  // =========================================================================
  describe('click trigger mode', () => {
    it('opens popover on click', async () => {
      const user = userEvent.setup()
      render(
        <Popover trigger={<button>Open</button>}>
          <div>Popover content</div>
        </Popover>
      )
      await user.click(screen.getByText('Open'))
      expect(screen.getByText('Popover content')).toBeInTheDocument()
    })

    it('sets aria-expanded=true when open', async () => {
      const user = userEvent.setup()
      render(
        <Popover trigger={<button>Open</button>}>
          <div>Content</div>
        </Popover>
      )
      await user.click(screen.getByText('Open'))
      const wrapper = screen.getByText('Open').closest('[aria-expanded]')
      expect(wrapper).toHaveAttribute('aria-expanded', 'true')
    })

    it('renders popover with role=dialog', async () => {
      const user = userEvent.setup()
      render(
        <Popover trigger={<button>Open</button>}>
          <div>Content</div>
        </Popover>
      )
      await user.click(screen.getByText('Open'))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('toggles popover closed on second click', async () => {
      const user = userEvent.setup()
      render(
        <Popover trigger={<button>Open</button>}>
          <div>Popover content</div>
        </Popover>
      )
      await user.click(screen.getByText('Open'))
      expect(screen.getByText('Popover content')).toBeInTheDocument()
      await user.click(screen.getByText('Open'))
      expect(screen.queryByText('Popover content')).not.toBeInTheDocument()
    })

    it('click handler is ignored in hover mode (only hover opens)', () => {
      render(
        <Popover trigger={<button>Open</button>} triggerMode="hover">
          <div>Popover content</div>
        </Popover>
      )
      // Direct fireEvent.click doesn't trigger mouseenter
      const triggerWrapper = screen.getByText('Open').closest('[aria-haspopup]')!
      fireEvent.click(triggerWrapper)
      expect(screen.queryByText('Popover content')).not.toBeInTheDocument()
    })
  })

  // =========================================================================
  // Hover trigger mode
  // =========================================================================
  describe('hover trigger mode', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('opens popover on mouse enter', async () => {
      render(
        <Popover trigger={<button>Hover me</button>} triggerMode="hover">
          <div>Hover content</div>
        </Popover>
      )
      const triggerWrapper = screen.getByText('Hover me').closest('[aria-haspopup]')!
      fireEvent.mouseEnter(triggerWrapper)
      expect(screen.getByText('Hover content')).toBeInTheDocument()
    })

    it('closes popover on mouse leave after timeout', async () => {
      render(
        <Popover trigger={<button>Hover me</button>} triggerMode="hover">
          <div>Hover content</div>
        </Popover>
      )
      const triggerWrapper = screen.getByText('Hover me').closest('[aria-haspopup]')!
      fireEvent.mouseEnter(triggerWrapper)
      expect(screen.getByText('Hover content')).toBeInTheDocument()

      fireEvent.mouseLeave(triggerWrapper)
      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(screen.queryByText('Hover content')).not.toBeInTheDocument()
    })

    it('stays open when mouse enters popover before timeout', async () => {
      render(
        <Popover trigger={<button>Hover me</button>} triggerMode="hover">
          <div>Hover content</div>
        </Popover>
      )
      const triggerWrapper = screen.getByText('Hover me').closest('[aria-haspopup]')!
      fireEvent.mouseEnter(triggerWrapper)
      expect(screen.getByText('Hover content')).toBeInTheDocument()

      // Leave trigger
      fireEvent.mouseLeave(triggerWrapper)
      // Enter popover before timeout
      const popover = screen.getByRole('dialog')
      fireEvent.mouseEnter(popover)
      act(() => {
        vi.advanceTimersByTime(200)
      })
      // Should still be visible
      expect(screen.getByText('Hover content')).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Controlled open state
  // =========================================================================
  describe('controlled open state', () => {
    it('shows content when open=true', () => {
      render(
        <Popover trigger={<button>Open</button>} open={true}>
          <div>Controlled content</div>
        </Popover>
      )
      expect(screen.getByText('Controlled content')).toBeInTheDocument()
    })

    it('hides content when open=false', () => {
      render(
        <Popover trigger={<button>Open</button>} open={false}>
          <div>Controlled content</div>
        </Popover>
      )
      expect(screen.queryByText('Controlled content')).not.toBeInTheDocument()
    })

    it('calls onOpenChange when trigger clicked', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      render(
        <Popover trigger={<button>Open</button>} open={false} onOpenChange={onOpenChange}>
          <div>Content</div>
        </Popover>
      )
      await user.click(screen.getByText('Open'))
      expect(onOpenChange).toHaveBeenCalledWith(true)
    })

    it('calls onOpenChange(false) when toggling open popover', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      render(
        <Popover trigger={<button>Open</button>} open={true} onOpenChange={onOpenChange}>
          <div>Content</div>
        </Popover>
      )
      await user.click(screen.getByText('Open'))
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  // =========================================================================
  // Close on Escape
  // =========================================================================
  describe('close on Escape', () => {
    it('closes popover on Escape key when uncontrolled', async () => {
      const user = userEvent.setup()
      render(
        <Popover trigger={<button>Open</button>}>
          <div>Popover content</div>
        </Popover>
      )
      await user.click(screen.getByText('Open'))
      expect(screen.getByText('Popover content')).toBeInTheDocument()
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(screen.queryByText('Popover content')).not.toBeInTheDocument()
    })

    it('calls onOpenChange(false) on Escape key when controlled', async () => {
      const onOpenChange = vi.fn()
      render(
        <Popover trigger={<button>Open</button>} open={true} onOpenChange={onOpenChange}>
          <div>Content</div>
        </Popover>
      )
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  // =========================================================================
  // Close on outside click
  // =========================================================================
  describe('close on outside click', () => {
    it('closes popover on outside click', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <Popover trigger={<button>Open</button>}>
            <div>Popover content</div>
          </Popover>
          <button>Outside</button>
        </div>
      )
      await user.click(screen.getByText('Open'))
      expect(screen.getByText('Popover content')).toBeInTheDocument()
      await user.click(screen.getByText('Outside'))
      expect(screen.queryByText('Popover content')).not.toBeInTheDocument()
    })
  })

  // =========================================================================
  // Custom className
  // =========================================================================
  describe('className prop', () => {
    it('passes className to popover container', async () => {
      const user = userEvent.setup()
      render(
        <Popover trigger={<button>Open</button>} className="custom-popover">
          <div>Content</div>
        </Popover>
      )
      await user.click(screen.getByText('Open'))
      const dialog = screen.getByRole('dialog')
      expect(dialog.className).toContain('custom-popover')
    })
  })

  // =========================================================================
  // Children rendering
  // =========================================================================
  describe('children rendering', () => {
    it('renders any children content inside popover', async () => {
      const user = userEvent.setup()
      render(
        <Popover trigger={<button>Open</button>}>
          <div>
            <h2>Title</h2>
            <p>Description</p>
            <button>Action</button>
          </div>
        </Popover>
      )
      await user.click(screen.getByText('Open'))
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Action')).toBeInTheDocument()
    })
  })
})
