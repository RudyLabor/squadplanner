import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorState } from '../ErrorState'
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

describe('ErrorState', () => {
  // ---- Default rendering ----
  describe('default rendering', () => {
    it('renders with default error type and page variant', () => {
      render(<ErrorState />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('renders default error title "Oups, une erreur est survenue"', () => {
      render(<ErrorState />)
      expect(screen.getByText('Oups, une erreur est survenue')).toBeInTheDocument()
    })

    it('has role="alert" and aria-live="polite" on page variant', () => {
      render(<ErrorState />)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('aria-live', 'polite')
    })

    it('uses w-8 h-8 icon size for page variant', () => {
      const { container } = render(<ErrorState />)
      // Page variant has the larger icon container (w-16 h-16)
      const iconContainer = container.querySelector('.w-16')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  // ---- Custom props ----
  describe('custom props', () => {
    it('renders custom title', () => {
      render(<ErrorState title="Custom Error Title" />)
      expect(screen.getByText('Custom Error Title')).toBeInTheDocument()
    })

    it('renders message when provided', () => {
      render(<ErrorState message="Something went wrong" />)
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('does NOT render message paragraph when message is undefined', () => {
      const { container } = render(<ErrorState />)
      // No message paragraph should exist
      const paragraphs = container.querySelectorAll('p.text-base')
      expect(paragraphs.length).toBe(0)
    })

    it('renders custom icon instead of preset icon', () => {
      render(<ErrorState icon={<span data-testid="custom-icon">!</span>} />)
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<ErrorState className="my-custom-class" />)
      const alert = screen.getByRole('alert')
      expect(alert.className).toContain('my-custom-class')
    })
  })

  // ---- All error types ----
  describe('error types', () => {
    it('renders "error" type with correct title', () => {
      render(<ErrorState type="error" />)
      expect(screen.getByText('Oups, une erreur est survenue')).toBeInTheDocument()
    })

    it('renders "warning" type with correct title', () => {
      render(<ErrorState type="warning" />)
      expect(screen.getByText('Attention')).toBeInTheDocument()
    })

    it('renders "info" type with correct title', () => {
      render(<ErrorState type="info" />)
      expect(screen.getByText('Information')).toBeInTheDocument()
    })

    it('renders "permission" type with correct title', () => {
      render(<ErrorState type="permission" />)
      expect(screen.getByText('Accès refusé')).toBeInTheDocument()
    })

    it('renders "not-found" type with correct title', () => {
      render(<ErrorState type="not-found" />)
      expect(screen.getByText('Introuvable')).toBeInTheDocument()
    })

    it('renders "network" type with correct title', () => {
      render(<ErrorState type="network" />)
      expect(screen.getByText('Erreur réseau')).toBeInTheDocument()
    })

    it('each type applies correct CSS classes', () => {
      const { rerender, container } = render(<ErrorState type="warning" variant="inline" />)
      let alert = screen.getByRole('alert')
      expect(alert.className).toContain('bg-warning/10')
      expect(alert.className).toContain('border-warning/20')

      rerender(<ErrorState type="info" variant="inline" />)
      alert = screen.getByRole('alert')
      expect(alert.className).toContain('bg-info/10')

      rerender(<ErrorState type="not-found" variant="inline" />)
      alert = screen.getByRole('alert')
      expect(alert.className).toContain('bg-primary/10')
    })
  })

  // ---- Retry button ----
  describe('retry functionality', () => {
    it('renders retry button when onRetry is provided', () => {
      render(<ErrorState onRetry={() => {}} />)
      expect(screen.getByText('Réessayer')).toBeInTheDocument()
    })

    it('does NOT render retry button when onRetry is undefined', () => {
      render(<ErrorState />)
      expect(screen.queryByText('Réessayer')).not.toBeInTheDocument()
    })

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      render(<ErrorState onRetry={onRetry} />)
      await user.click(screen.getByText('Réessayer'))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('shows custom retryLabel when provided', () => {
      render(<ErrorState onRetry={() => {}} retryLabel="Try again" />)
      expect(screen.getByText('Try again')).toBeInTheDocument()
    })

    it('shows countdown text when retryCountdown > 0', () => {
      render(<ErrorState onRetry={() => {}} retryCountdown={5} />)
      expect(screen.getByText('Réessayer dans 5s')).toBeInTheDocument()
    })

    it('shows default label when retryCountdown is 0', () => {
      render(<ErrorState onRetry={() => {}} retryCountdown={0} />)
      expect(screen.getByText('Réessayer')).toBeInTheDocument()
    })

    it('shows retryLabel over countdown when both provided and countdown is 0', () => {
      render(<ErrorState onRetry={() => {}} retryLabel="Retry now" retryCountdown={0} />)
      expect(screen.getByText('Retry now')).toBeInTheDocument()
    })

    it('shows countdown over retryLabel when countdown > 0', () => {
      render(<ErrorState onRetry={() => {}} retryLabel="Retry now" retryCountdown={3} />)
      expect(screen.getByText('Réessayer dans 3s')).toBeInTheDocument()
    })

    it('disables retry button when isRetrying is true', () => {
      render(<ErrorState onRetry={() => {}} isRetrying />)
      const btn = screen.getByText('Réessayer').closest('button')
      expect(btn).toBeDisabled()
    })

    it('enables retry button when isRetrying is false (default)', () => {
      render(<ErrorState onRetry={() => {}} />)
      const btn = screen.getByText('Réessayer').closest('button')
      expect(btn).not.toBeDisabled()
    })
  })

  // ---- Page variant specifics ----
  describe('page variant', () => {
    it('renders goBack button when onGoBack is provided', () => {
      render(<ErrorState onGoBack={() => {}} />)
      expect(screen.getByText('Retour')).toBeInTheDocument()
    })

    it('renders goHome button when onGoHome is provided', () => {
      render(<ErrorState onGoHome={() => {}} />)
      expect(screen.getByText('Accueil')).toBeInTheDocument()
    })

    it('renders both goBack and goHome buttons', () => {
      render(<ErrorState onGoBack={() => {}} onGoHome={() => {}} />)
      expect(screen.getByText('Retour')).toBeInTheDocument()
      expect(screen.getByText('Accueil')).toBeInTheDocument()
    })

    it('does NOT render goBack/goHome buttons when callbacks are not provided', () => {
      render(<ErrorState />)
      expect(screen.queryByText('Retour')).not.toBeInTheDocument()
      expect(screen.queryByText('Accueil')).not.toBeInTheDocument()
    })

    it('calls onGoBack when Retour button is clicked', async () => {
      const user = userEvent.setup()
      const onGoBack = vi.fn()
      render(<ErrorState onGoBack={onGoBack} />)
      await user.click(screen.getByText('Retour'))
      expect(onGoBack).toHaveBeenCalledTimes(1)
    })

    it('calls onGoHome when Accueil button is clicked', async () => {
      const user = userEvent.setup()
      const onGoHome = vi.fn()
      render(<ErrorState onGoHome={onGoHome} />)
      await user.click(screen.getByText('Accueil'))
      expect(onGoHome).toHaveBeenCalledTimes(1)
    })

    it('renders retry, goBack, and goHome together', () => {
      render(<ErrorState onRetry={() => {}} onGoBack={() => {}} onGoHome={() => {}} />)
      expect(screen.getByText('Réessayer')).toBeInTheDocument()
      expect(screen.getByText('Retour')).toBeInTheDocument()
      expect(screen.getByText('Accueil')).toBeInTheDocument()
    })

    it('renders message paragraph when message is provided', () => {
      render(<ErrorState message="Detailed error description" />)
      expect(screen.getByText('Detailed error description')).toBeInTheDocument()
    })
  })

  // ---- Inline variant ----
  describe('inline variant', () => {
    it('renders with inline layout', () => {
      const { container } = render(<ErrorState variant="inline" />)
      expect(container.querySelector('.p-3')).toBeInTheDocument()
    })

    it('has role="alert" and aria-live="polite"', () => {
      render(<ErrorState variant="inline" />)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('aria-live', 'polite')
    })

    it('renders title', () => {
      render(<ErrorState variant="inline" title="Inline Error" />)
      expect(screen.getByText('Inline Error')).toBeInTheDocument()
    })

    it('renders message when provided', () => {
      render(<ErrorState variant="inline" message="Detail text" />)
      expect(screen.getByText('Detail text')).toBeInTheDocument()
    })

    it('does NOT render message when undefined', () => {
      const { container } = render(<ErrorState variant="inline" />)
      // Only title paragraph, no message paragraph
      const texts = container.querySelectorAll('.text-xs')
      // We should not find any message text elements beyond what's expected
      expect(screen.queryByText('undefined')).not.toBeInTheDocument()
    })

    it('renders retry button when onRetry is provided', () => {
      render(<ErrorState variant="inline" onRetry={() => {}} />)
      expect(screen.getByText('Réessayer')).toBeInTheDocument()
    })

    it('does NOT render retry button when onRetry is not provided', () => {
      render(<ErrorState variant="inline" />)
      expect(screen.queryByText('Réessayer')).not.toBeInTheDocument()
    })

    it('disables retry button when isRetrying', () => {
      render(<ErrorState variant="inline" onRetry={() => {}} isRetrying />)
      const btn = screen.getByText('Réessayer').closest('button')
      expect(btn).toBeDisabled()
    })

    it('calls onRetry on click', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      render(<ErrorState variant="inline" onRetry={onRetry} />)
      await user.click(screen.getByText('Réessayer'))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('does NOT render goBack/goHome buttons (inline has no navigation)', () => {
      render(<ErrorState variant="inline" onGoBack={() => {}} onGoHome={() => {}} />)
      expect(screen.queryByText('Retour')).not.toBeInTheDocument()
      expect(screen.queryByText('Accueil')).not.toBeInTheDocument()
    })

    it('uses w-4 h-4 icon size for inline variant', () => {
      const { container } = render(<ErrorState variant="inline" />)
      const iconContainer = container.querySelector('.w-8.h-8')
      expect(iconContainer).toBeInTheDocument()
    })

    it('applies correct type-based CSS classes', () => {
      render(<ErrorState variant="inline" type="network" />)
      const alert = screen.getByRole('alert')
      expect(alert.className).toContain('bg-error/10')
      expect(alert.className).toContain('border-error/20')
    })
  })

  // ---- Banner variant ----
  describe('banner variant', () => {
    it('has role="alert" and aria-live="assertive"', () => {
      render(<ErrorState variant="banner" />)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('aria-live', 'assertive')
    })

    it('renders fixed positioning for banner', () => {
      const { container } = render(<ErrorState variant="banner" />)
      const banner = container.querySelector('.fixed')
      expect(banner).toBeInTheDocument()
    })

    it('renders title', () => {
      render(<ErrorState variant="banner" title="Banner Error" />)
      expect(screen.getByText('Banner Error')).toBeInTheDocument()
    })

    it('renders message when provided', () => {
      render(<ErrorState variant="banner" message="Banner detail" />)
      expect(screen.getByText('Banner detail')).toBeInTheDocument()
    })

    it('does NOT render message when undefined', () => {
      render(<ErrorState variant="banner" />)
      expect(screen.queryByText('undefined')).not.toBeInTheDocument()
    })

    it('renders retry button when onRetry is provided', () => {
      render(<ErrorState variant="banner" onRetry={() => {}} />)
      expect(screen.getByText('Réessayer')).toBeInTheDocument()
    })

    it('does NOT render retry button when onRetry is not provided', () => {
      render(<ErrorState variant="banner" />)
      expect(screen.queryByText('Réessayer')).not.toBeInTheDocument()
    })

    it('renders dismiss button when onDismiss is provided', () => {
      render(<ErrorState variant="banner" onDismiss={() => {}} />)
      expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
    })

    it('does NOT render dismiss button when onDismiss is not provided', () => {
      render(<ErrorState variant="banner" />)
      expect(screen.queryByLabelText('Fermer')).not.toBeInTheDocument()
    })

    it('calls onDismiss when dismiss button is clicked', async () => {
      const user = userEvent.setup()
      const onDismiss = vi.fn()
      render(<ErrorState variant="banner" onDismiss={onDismiss} />)
      await user.click(screen.getByLabelText('Fermer'))
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('calls onRetry on banner retry click', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      render(<ErrorState variant="banner" onRetry={onRetry} />)
      await user.click(screen.getByText('Réessayer'))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('disables retry button when isRetrying', () => {
      render(<ErrorState variant="banner" onRetry={() => {}} isRetrying />)
      const btn = screen.getByText('Réessayer').closest('button')
      expect(btn).toBeDisabled()
    })

    it('renders both retry and dismiss buttons', () => {
      render(<ErrorState variant="banner" onRetry={() => {}} onDismiss={() => {}} />)
      expect(screen.getByText('Réessayer')).toBeInTheDocument()
      expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
    })

    it('does NOT render goBack/goHome buttons in banner', () => {
      render(<ErrorState variant="banner" onGoBack={() => {}} onGoHome={() => {}} />)
      expect(screen.queryByText('Retour')).not.toBeInTheDocument()
      expect(screen.queryByText('Accueil')).not.toBeInTheDocument()
    })

    it('shows countdown text in banner retry button', () => {
      render(<ErrorState variant="banner" onRetry={() => {}} retryCountdown={10} />)
      expect(screen.getByText('Réessayer dans 10s')).toBeInTheDocument()
    })
  })

  // ---- Icon size varies by variant ----
  describe('icon size by variant', () => {
    it('page variant uses larger icon (w-8 h-8)', () => {
      // The page variant calls TYPE_PRESETS with 'w-8 h-8' icon size
      // and has a w-16 h-16 icon container
      const { container } = render(<ErrorState variant="page" />)
      expect(container.querySelector('.w-16.h-16')).toBeInTheDocument()
    })

    it('inline variant uses smaller icon (w-4 h-4)', () => {
      // Inline variant calls TYPE_PRESETS with 'w-4 h-4'
      // and has a w-8 h-8 icon container
      const { container } = render(<ErrorState variant="inline" />)
      expect(container.querySelector('.w-8.h-8')).toBeInTheDocument()
    })

    it('banner variant uses smaller icon (w-4 h-4)', () => {
      const { container } = render(<ErrorState variant="banner" />)
      expect(container.querySelector('.w-8.h-8')).toBeInTheDocument()
    })
  })

  // ---- Combined scenarios ----
  describe('combined scenarios', () => {
    it('renders warning banner with retry and dismiss', () => {
      render(
        <ErrorState
          variant="banner"
          type="warning"
          title="Connection Lost"
          message="Please check your internet"
          onRetry={() => {}}
          onDismiss={() => {}}
          retryCountdown={5}
        />
      )
      expect(screen.getByText('Connection Lost')).toBeInTheDocument()
      expect(screen.getByText('Please check your internet')).toBeInTheDocument()
      expect(screen.getByText('Réessayer dans 5s')).toBeInTheDocument()
      expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
    })

    it('renders network error inline with retry', () => {
      render(
        <ErrorState
          variant="inline"
          type="network"
          message="Failed to load data"
          onRetry={() => {}}
          isRetrying
        />
      )
      expect(screen.getByText('Erreur réseau')).toBeInTheDocument()
      expect(screen.getByText('Failed to load data')).toBeInTheDocument()
      const btn = screen.getByText('Réessayer').closest('button')
      expect(btn).toBeDisabled()
    })

    it('renders permission error page with navigation', () => {
      render(
        <ErrorState
          type="permission"
          message="You do not have access to this resource"
          onGoBack={() => {}}
          onGoHome={() => {}}
        />
      )
      expect(screen.getByText('Accès refusé')).toBeInTheDocument()
      expect(screen.getByText('Retour')).toBeInTheDocument()
      expect(screen.getByText('Accueil')).toBeInTheDocument()
    })
  })
})
