import { Component, type ReactNode } from 'react'
import { RefreshCw, AlertTriangle, Home, ArrowLeft, Trash2 } from 'lucide-react'
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

    // Send to Sentry (only works in production when configured)
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
    window.location.href = '/home'
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

            <h2 className="text-xl font-semibold text-text-primary mb-2">
              {this.state.isChunkError ? 'Mise à jour disponible' : 'Oups, quelque chose s\'est mal passé'}
            </h2>

            <p className="text-[14px] text-text-secondary mb-6">
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
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-[14px] font-medium hover:bg-[#7c7ff7] transition-colors mb-3"
            >
              <RefreshCw className="w-4 h-4" />
              {this.state.isChunkError ? 'Mettre à jour' : 'Réessayer'}
            </button>

            {/* Secondary actions */}
            <div className="flex gap-2">
              <button
                onClick={this.handleGoBack}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-text-secondary text-[13px] font-medium hover:bg-white/10 transition-colors border border-white/10"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-text-secondary text-[13px] font-medium hover:bg-white/10 transition-colors border border-white/10"
              >
                <Home className="w-4 h-4" />
                Accueil
              </button>
            </div>

            {/* Clear cache option (shown after first retry) */}
            {hasRetried && (
              <button
                onClick={this.handleClearCacheAndReload}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#f87171]/10 text-[#f87171] text-[13px] font-medium hover:bg-[#f87171]/20 transition-colors border border-[#f87171]/20"
              >
                <Trash2 className="w-4 h-4" />
                Vider le cache et recharger
              </button>
            )}

            {/* Show technical details in dev mode */}
            {!import.meta.env.PROD && this.state.error && (
              <div className="mt-6 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-border-default text-left">
                <p className="text-[11px] font-medium text-text-secondary mb-1">Détails techniques :</p>
                <p className="text-[12px] font-mono text-error break-all">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-[10px] font-mono text-[#6b6b70] mt-2 overflow-auto max-h-32">
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
