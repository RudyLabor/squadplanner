import { Component, type ReactNode } from 'react'
import {
  RefreshCw,
  AlertTriangle,
  Home,
  ArrowLeft,
  Trash2,
} from './icons'
import { captureException } from '../lib/sentry'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  isChunkError: boolean
  retryCount: number
}

// Detect if error is a chunk/module loading error
function isChunkLoadError(error: Error): boolean {
  const message = error.message.toLowerCase()
  return (
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('loading chunk') ||
    message.includes('loading css chunk') ||
    message.includes('failed to load module') ||
    error.name === 'ChunkLoadError'
  )
}

// Clear service worker cache
async function clearCache(): Promise<void> {
  try {
    // Clear all caches
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames
        .filter(name => name.startsWith('squadplanner-'))
        .map(name => caches.delete(name))
    )

    // Tell service worker to clear cache too
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      registration.active?.postMessage({ type: 'CLEAR_CACHE' })
    }
  } catch (error) {
    console.error('[ErrorBoundary] Failed to clear cache:', error)
  }
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, isChunkError: false, retryCount: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      isChunkError: isChunkLoadError(error)
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging and send to error tracking
    console.error('[ErrorBoundary] Error caught:', error.message)

    // Send to error tracker (only works in production)
    captureException(error, {
      componentStack: errorInfo.componentStack,
      isChunkError: this.state.isChunkError,
    })
  }

  handleRetry = () => {
    // For chunk errors, do a hard reload to get fresh assets
    if (this.state.isChunkError) {
      window.location.reload()
    } else {
      // For other errors, try resetting state first
      this.setState(prev => ({
        hasError: false,
        error: undefined,
        isChunkError: false,
        retryCount: prev.retryCount + 1
      }))
    }
  }

  handleGoHome = () => {
    window.location.href = '/squads'
  }

  handleGoBack = () => {
    window.history.back()
  }

  handleClearCacheAndReload = async () => {
    await clearCache()
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const hasRetried = this.state.retryCount > 0

      // Default error UI with recovery actions
      return (
        <div className="min-h-screen bg-bg-base flex items-center justify-center p-4" role="alert">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-error-10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>

            <h2 className="text-lg font-semibold text-text-primary mb-2">
              {this.state.isChunkError ? 'Mise à jour disponible' : 'Oups, quelque chose s\'est mal passé'}
            </h2>

            <p className="text-md text-text-secondary mb-6">
              {this.state.isChunkError
                ? 'Une nouvelle version de l\'app est disponible. Recharge la page pour en profiter.'
                : hasRetried
                  ? 'L\'erreur persiste. Essaie de vider le cache ou de retourner à l\'accueil.'
                  : 'Une erreur inattendue s\'est produite. Essaie de recharger la page.'
              }
            </p>

            {/* Primary action */}
            <button
              onClick={this.handleRetry}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-md font-medium hover:bg-primary-hover transition-colors mb-3"
            >
              <RefreshCw className="w-4 h-4" />
              {this.state.isChunkError ? 'Mettre à jour' : 'Réessayer'}
            </button>

            {/* Secondary actions */}
            <div className="flex gap-2">
              <button
                onClick={this.handleGoBack}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-overlay-subtle text-text-secondary text-base font-medium hover:bg-overlay-light transition-colors border border-border-subtle"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-overlay-subtle text-text-secondary text-base font-medium hover:bg-overlay-light transition-colors border border-border-subtle"
              >
                <Home className="w-4 h-4" />
                Accueil
              </button>
            </div>

            {/* Navigation links */}
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              <a href="/squads" className="px-4 py-2 rounded-lg bg-bg-elevated text-text-secondary text-sm hover:bg-bg-hover transition-colors border border-border-subtle">Squads</a>
              <a href="/sessions" className="px-4 py-2 rounded-lg bg-bg-elevated text-text-secondary text-sm hover:bg-bg-hover transition-colors border border-border-subtle">Sessions</a>
              <a href="/messages" className="px-4 py-2 rounded-lg bg-bg-elevated text-text-secondary text-sm hover:bg-bg-hover transition-colors border border-border-subtle">Messages</a>
            </div>

            {/* Clear cache option (shown after first retry) */}
            {hasRetried && (
              <button
                onClick={this.handleClearCacheAndReload}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-error/10 text-error text-base font-medium hover:bg-error/20 transition-colors border border-error/20"
              >
                <Trash2 className="w-4 h-4" />
                Vider le cache et recharger
              </button>
            )}

            {/* Show technical details in dev mode */}
            {!import.meta.env.PROD && this.state.error && (
              <div className="mt-6 p-4 rounded-xl bg-surface-card border border-border-default text-left">
                <p className="text-sm font-medium text-text-secondary mb-1">Détails techniques :</p>
                <p className="text-sm font-mono text-error break-all">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-xs font-mono text-text-tertiary mt-2 overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
