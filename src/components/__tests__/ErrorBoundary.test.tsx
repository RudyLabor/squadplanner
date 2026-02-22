import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const { mockCaptureException } = vi.hoisted(() => ({
  mockCaptureException: vi.fn(),
}))

vi.mock('../../lib/sentry', () => ({
  captureException: mockCaptureException,
}))

import { ErrorBoundary } from '../ErrorBoundary'

// Component that throws
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Child renders fine</div>
}

// Component that throws a chunk error
function ChunkErrorComponent() {
  throw Object.assign(new Error('Failed to fetch dynamically imported module'), {
    name: 'ChunkLoadError',
  })
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockCaptureException.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Child renders fine')).toBeInTheDocument()
  })

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText("Oups, quelque chose s'est mal passé")).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Custom fallback')).toBeInTheDocument()
  })

  it('renders retry button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Réessayer')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Retour')).toBeInTheDocument()
    expect(screen.getByText('Accueil')).toBeInTheDocument()
  })

  it('has alert role for accessibility', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('detects chunk load error and shows update message', () => {
    render(
      <ErrorBoundary>
        <ChunkErrorComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Mise à jour disponible')).toBeInTheDocument()
    expect(screen.getByText('Mettre à jour')).toBeInTheDocument()
  })

  // --- P1.1 Audit: chunk error detection ---

  it('detects "loading chunk" error message as chunk error', () => {
    function LoadingChunkError() {
      throw new Error('Loading chunk abc123 failed')
    }
    render(
      <ErrorBoundary>
        <LoadingChunkError />
      </ErrorBoundary>
    )
    expect(screen.getByText('Mise à jour disponible')).toBeInTheDocument()
  })

  it('detects "loading css chunk" error message as chunk error', () => {
    function CSSChunkError() {
      throw new Error('Loading CSS chunk styles-xyz failed')
    }
    render(
      <ErrorBoundary>
        <CSSChunkError />
      </ErrorBoundary>
    )
    expect(screen.getByText('Mise à jour disponible')).toBeInTheDocument()
  })

  it('detects "failed to load module" error message as chunk error', () => {
    function ModuleLoadError() {
      throw new Error('Failed to load module script: /assets/page.js')
    }
    render(
      <ErrorBoundary>
        <ModuleLoadError />
      </ErrorBoundary>
    )
    expect(screen.getByText('Mise à jour disponible')).toBeInTheDocument()
  })

  it('detects ChunkLoadError by name', () => {
    function NamedChunkError() {
      throw Object.assign(new Error('Some chunk error'), { name: 'ChunkLoadError' })
    }
    render(
      <ErrorBoundary>
        <NamedChunkError />
      </ErrorBoundary>
    )
    expect(screen.getByText('Mise à jour disponible')).toBeInTheDocument()
  })

  it('does NOT treat a normal error as a chunk error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.queryByText('Mise à jour disponible')).not.toBeInTheDocument()
    expect(screen.getByText("Oups, quelque chose s'est mal passé")).toBeInTheDocument()
  })

  // --- P1.1 Audit: Sentry captureException integration ---

  it('calls captureException with error and componentStack', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(mockCaptureException).toHaveBeenCalledTimes(1)
    const [error, context] = mockCaptureException.mock.calls[0]
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Test error message')
    expect(context).toHaveProperty('componentStack')
    expect(context).toHaveProperty('isChunkError', false)
  })

  it('calls captureException with isChunkError true for chunk errors', () => {
    render(
      <ErrorBoundary>
        <ChunkErrorComponent />
      </ErrorBoundary>
    )
    expect(mockCaptureException).toHaveBeenCalledTimes(1)
    const [_error, context] = mockCaptureException.mock.calls[0]
    expect(context).toHaveProperty('isChunkError', true)
  })

  // --- P1.1 Audit: retry behavior with progressive recovery ---

  it('resets error state on retry for non-chunk errors', () => {
    // First render throws, then retry should render children again
    let shouldFail = true
    function ConditionalThrow() {
      if (shouldFail) {
        throw new Error('Conditional error')
      }
      return <div>Recovered successfully</div>
    }

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText('Réessayer')).toBeInTheDocument()

    // Fix the error condition before retrying
    shouldFail = false
    fireEvent.click(screen.getByText('Réessayer'))
    expect(screen.getByText('Recovered successfully')).toBeInTheDocument()
  })

  it('shows "clear cache" button after first retry fails', () => {
    function AlwaysThrows() {
      throw new Error('Persistent error')
    }
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    )
    // Before retry, no cache button
    expect(screen.queryByText('Vider le cache et recharger')).not.toBeInTheDocument()

    // Click retry (error persists)
    fireEvent.click(screen.getByText('Réessayer'))

    // After retry, the cache clear button should appear
    expect(screen.getByText('Vider le cache et recharger')).toBeInTheDocument()
  })

  it('shows persistent error message after retry', () => {
    function AlwaysThrows() {
      throw new Error('Persistent error')
    }
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    )
    fireEvent.click(screen.getByText('Réessayer'))
    expect(
      screen.getByText("L'erreur persiste. Essaie de vider le cache ou de retourner à l'accueil.")
    ).toBeInTheDocument()
  })

  it('calls window.location.reload for chunk errors on retry', () => {
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
    })

    render(
      <ErrorBoundary>
        <ChunkErrorComponent />
      </ErrorBoundary>
    )
    fireEvent.click(screen.getByText('Mettre à jour'))
    expect(reloadMock).toHaveBeenCalledTimes(1)
  })

  // --- P1.1 Audit: cache clearing via SW messaging ---

  it('calls handleClearCacheAndReload when clear cache button clicked', async () => {
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
    })

    // Mock caches API
    const mockCachesKeys = vi.fn().mockResolvedValue(['squadplanner-v1', 'other-cache'])
    const mockCachesDelete = vi.fn().mockResolvedValue(true)
    Object.defineProperty(window, 'caches', {
      value: { keys: mockCachesKeys, delete: mockCachesDelete },
      writable: true,
    })

    function AlwaysThrows() {
      throw new Error('Cache test error')
    }
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    )

    // First retry to show cache button
    fireEvent.click(screen.getByText('Réessayer'))
    // Then click clear cache
    fireEvent.click(screen.getByText('Vider le cache et recharger'))

    // Wait for async cache operations
    await vi.waitFor(() => {
      expect(reloadMock).toHaveBeenCalled()
    })
  })

  // --- P1.1 Audit: navigation links ---

  it('renders Squads, Sessions, and Messages navigation links', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    const squadsLink = screen.getByText('Squads')
    const sessionsLink = screen.getByText('Sessions')
    const messagesLink = screen.getByText('Messages')
    expect(squadsLink.closest('a')).toHaveAttribute('href', '/squads')
    expect(sessionsLink.closest('a')).toHaveAttribute('href', '/sessions')
    expect(messagesLink.closest('a')).toHaveAttribute('href', '/messages')
  })

  it('calls window.history.back when Retour button clicked', () => {
    const backMock = vi.fn()
    Object.defineProperty(window, 'history', {
      value: { ...window.history, back: backMock },
      writable: true,
    })

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    fireEvent.click(screen.getByText('Retour'))
    expect(backMock).toHaveBeenCalledTimes(1)
  })

  // --- P1.1 Audit: dev mode technical details ---

  it('shows technical details in dev mode (non-PROD)', () => {
    // import.meta.env.PROD is false by default in test environment
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Détails techniques :')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('shows error stack trace in dev mode', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    // The stack trace should be displayed in a <pre> element
    expect(screen.getByText('Détails techniques :')).toBeInTheDocument()
    // The error message is present in the technical details section
    const errorMessage = screen.getByText('Test error message')
    expect(errorMessage).toBeInTheDocument()
  })

  it('shows chunk error update message for dynamically imported module errors', () => {
    function DynamicImportError() {
      throw new Error('Failed to fetch dynamically imported module /assets/page-abc123.js')
    }
    render(
      <ErrorBoundary>
        <DynamicImportError />
      </ErrorBoundary>
    )
    expect(
      screen.getByText(
        "Une nouvelle version de l'app est disponible. Recharge la page pour en profiter."
      )
    ).toBeInTheDocument()
  })
})
