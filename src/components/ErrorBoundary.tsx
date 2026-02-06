import { Component, type ReactNode } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  isChunkError: boolean
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

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, isChunkError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isChunkError: isChunkLoadError(error)
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging (in production, send to error tracking service)
    if (import.meta.env.PROD) {
      console.error('[ErrorBoundary] Error caught:', error.message)
    } else {
      console.error('[ErrorBoundary] Error caught:', error, errorInfo)
    }
  }

  handleReload = () => {
    // For chunk errors, do a hard reload to get fresh assets
    if (this.state.isChunkError) {
      window.location.reload()
    } else {
      // For other errors, try resetting state first
      this.setState({ hasError: false, error: undefined, isChunkError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-[#050506] flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(248,113,113,0.1)] flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-[#fb7185]" />
            </div>

            <h2 className="text-xl font-semibold text-[#f7f8f8] mb-2">
              {this.state.isChunkError ? 'Mise à jour disponible' : 'Oups, quelque chose s\'est mal passé'}
            </h2>

            <p className="text-[14px] text-[#8b8d90] mb-6">
              {this.state.isChunkError
                ? 'Une nouvelle version de l\'app est disponible. Recharge la page pour en profiter.'
                : 'Une erreur inattendue s\'est produite. Essaie de recharger la page.'
              }
            </p>

            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6366f1] text-white text-[14px] font-medium hover:bg-[#7c7ff7] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Recharger la page
            </button>

            {/* Show technical details in dev mode */}
            {!import.meta.env.PROD && this.state.error && (
              <div className="mt-6 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] text-left">
                <p className="text-[12px] font-mono text-[#fb7185] break-all">
                  {this.state.error.message}
                </p>
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
