import type { ReactNode } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldAlert,
  SearchX,
  WifiOff,
  RefreshCw,
  ArrowLeft,
  Home,
  X,
  Loader2,
} from '../icons'
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ErrorType = 'error' | 'warning' | 'info' | 'permission' | 'not-found' | 'network'
type ErrorVariant = 'page' | 'inline' | 'banner'

interface ErrorStateProps {
  variant?: ErrorVariant
  type?: ErrorType
  title?: string
  message?: string
  icon?: ReactNode
  onRetry?: () => void
  retryLabel?: string
  onDismiss?: () => void
  onGoBack?: () => void
  onGoHome?: () => void
  isRetrying?: boolean
  retryCountdown?: number
  className?: string
}

// ---------------------------------------------------------------------------
// Type presets
// ---------------------------------------------------------------------------

interface TypePreset {
  icon: ReactNode
  title: string
  color: string // e.g. "error", "warning", "info"
  bgClass: string // e.g. "bg-error/10"
  borderClass: string // e.g. "border-error/20"
  textClass: string // e.g. "text-error"
  iconBgClass: string // e.g. "bg-error/20"
}

const TYPE_PRESETS: Record<ErrorType, (iconSize: string) => TypePreset> = {
  error: (s) => ({
    icon: <AlertTriangle className={s} />,
    title: 'Oups, une erreur est survenue',
    color: 'error',
    bgClass: 'bg-error/10',
    borderClass: 'border-error/20',
    textClass: 'text-error',
    iconBgClass: 'bg-error/20',
  }),
  warning: (s) => ({
    icon: <AlertCircle className={s} />,
    title: 'Attention',
    color: 'warning',
    bgClass: 'bg-warning/10',
    borderClass: 'border-warning/20',
    textClass: 'text-warning',
    iconBgClass: 'bg-warning/20',
  }),
  info: (s) => ({
    icon: <Info className={s} />,
    title: 'Information',
    color: 'info',
    bgClass: 'bg-info/10',
    borderClass: 'border-info/20',
    textClass: 'text-info',
    iconBgClass: 'bg-info/20',
  }),
  permission: (s) => ({
    icon: <ShieldAlert className={s} />,
    title: 'Accès refusé',
    color: 'error',
    bgClass: 'bg-error/10',
    borderClass: 'border-error/20',
    textClass: 'text-error',
    iconBgClass: 'bg-error/20',
  }),
  'not-found': (s) => ({
    icon: <SearchX className={s} />,
    title: 'Introuvable',
    color: 'primary',
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/20',
    textClass: 'text-primary',
    iconBgClass: 'bg-primary/20',
  }),
  network: (s) => ({
    icon: <WifiOff className={s} />,
    title: 'Erreur réseau',
    color: 'error',
    bgClass: 'bg-error/10',
    borderClass: 'border-error/20',
    textClass: 'text-error',
    iconBgClass: 'bg-error/20',
  }),
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ErrorState({
  variant = 'page',
  type = 'error',
  title,
  message,
  icon,
  onRetry,
  retryLabel,
  onDismiss,
  onGoBack,
  onGoHome,
  isRetrying = false,
  retryCountdown,
  className = '',
}: ErrorStateProps) {
  const iconSize = variant === 'page' ? 'w-8 h-8' : 'w-4 h-4'
  const preset = TYPE_PRESETS[type](iconSize)

  const resolvedIcon = icon ?? preset.icon
  const resolvedTitle = title ?? preset.title

  const retryText =
    retryCountdown && retryCountdown > 0
      ? `Réessayer dans ${retryCountdown}s`
      : (retryLabel ?? 'Réessayer')

  if (variant === 'banner') {
    return (
      <BannerVariant
        preset={preset}
        icon={resolvedIcon}
        title={resolvedTitle}
        message={message}
        onRetry={onRetry}
        retryText={retryText}
        isRetrying={isRetrying}
        onDismiss={onDismiss}
        className={className}
      />
    )
  }

  if (variant === 'inline') {
    return (
      <InlineVariant
        preset={preset}
        icon={resolvedIcon}
        title={resolvedTitle}
        message={message}
        onRetry={onRetry}
        retryText={retryText}
        isRetrying={isRetrying}
        className={className}
      />
    )
  }

  return (
    <PageVariant
      preset={preset}
      icon={resolvedIcon}
      title={resolvedTitle}
      message={message}
      onRetry={onRetry}
      retryText={retryText}
      isRetrying={isRetrying}
      onGoBack={onGoBack}
      onGoHome={onGoHome}
      className={className}
    />
  )
}

// ---------------------------------------------------------------------------
// Page variant — full-page centered error
// ---------------------------------------------------------------------------

function PageVariant({
  preset,
  icon,
  title,
  message,
  onRetry,
  retryText,
  isRetrying,
  onGoBack,
  onGoHome,
  className,
}: {
  preset: TypePreset
  icon: ReactNode
  title: string
  message?: string
  onRetry?: () => void
  retryText: string
  isRetrying: boolean
  onGoBack?: () => void
  onGoHome?: () => void
  className: string
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center justify-center py-10 px-4 text-center ${className}`}
      role="alert"
      aria-live="polite"
    >
      <m.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
        className={`w-16 h-16 rounded-2xl ${preset.iconBgClass} flex items-center justify-center mb-6`}
      >
        <span className={preset.textClass}>{icon}</span>
      </m.div>

      <h2 className="text-xl font-semibold text-text-primary mb-2">{title}</h2>

      {message && <p className="text-md text-text-secondary mb-6 max-w-sm">{message}</p>}

      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="w-full max-w-xs inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-bg text-white text-md font-medium hover:bg-primary-bg-hover transition-colors disabled:opacity-60 mb-3"
        >
          {isRetrying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {retryText}
        </button>
      )}

      {(onGoBack || onGoHome) && (
        <div className="flex gap-2 w-full max-w-xs">
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-overlay-subtle text-text-secondary text-base font-medium hover:bg-overlay-light transition-colors border border-border-subtle"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          )}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-overlay-subtle text-text-secondary text-base font-medium hover:bg-overlay-light transition-colors border border-border-subtle"
            >
              <Home className="w-4 h-4" />
              Accueil
            </button>
          )}
        </div>
      )}
    </m.div>
  )
}

// ---------------------------------------------------------------------------
// Inline variant — compact error for cards / sections
// ---------------------------------------------------------------------------

function InlineVariant({
  preset,
  icon,
  title,
  message,
  onRetry,
  retryText,
  isRetrying,
  className,
}: {
  preset: TypePreset
  icon: ReactNode
  title: string
  message?: string
  onRetry?: () => void
  retryText: string
  isRetrying: boolean
  className: string
}) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex items-start gap-3 p-3 rounded-xl ${preset.bgClass} border ${preset.borderClass} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div
        className={`w-8 h-8 rounded-lg ${preset.iconBgClass} flex items-center justify-center flex-shrink-0`}
      >
        <span className={preset.textClass}>{icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${preset.textClass}`}>{title}</p>
        {message && <p className={`text-xs ${preset.textClass} opacity-80 mt-0.5`}>{message}</p>}
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium ${preset.textClass} hover:underline disabled:opacity-60`}
          >
            {isRetrying ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            {retryText}
          </button>
        )}
      </div>
    </m.div>
  )
}

// ---------------------------------------------------------------------------
// Banner variant — top-of-page slide-down banner
// ---------------------------------------------------------------------------

function BannerVariant({
  preset,
  icon,
  title,
  message,
  onRetry,
  retryText,
  isRetrying,
  onDismiss,
  className,
}: {
  preset: TypePreset
  icon: ReactNode
  title: string
  message?: string
  onRetry?: () => void
  retryText: string
  isRetrying: boolean
  onDismiss?: () => void
  className: string
}) {
  return (
    <AnimatePresence>
      <m.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 right-0 z-[9999] safe-area-pt ${className}`}
        role="alert"
        aria-live="assertive"
      >
        <div
          className={`mx-4 mt-2 p-3 rounded-xl ${preset.bgClass} border ${preset.borderClass} backdrop-blur-md shadow-lg`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg ${preset.iconBgClass} flex items-center justify-center flex-shrink-0`}
            >
              <span className={preset.textClass}>{icon}</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-md font-medium ${preset.textClass}`}>{title}</p>
              {message && <p className={`text-sm ${preset.textClass} opacity-80`}>{message}</p>}
            </div>

            {onRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${preset.textClass} ${preset.iconBgClass} hover:opacity-80 transition-opacity disabled:opacity-60 flex items-center gap-1.5`}
              >
                {isRetrying ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                {retryText}
              </button>
            )}

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-2 rounded-lg hover:bg-overlay-light transition-colors"
                aria-label="Fermer"
              >
                <X className={`w-4 h-4 ${preset.textClass} opacity-60`} />
              </button>
            )}
          </div>
        </div>
      </m.div>
    </AnimatePresence>
  )
}
