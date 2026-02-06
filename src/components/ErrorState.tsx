import { motion } from 'framer-motion'
import {
  WifiOff,
  FileQuestion,
  ShieldX,
  ServerCrash,
  AlertTriangle,
  RefreshCcw,
  Home
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui'

interface ErrorStateProps {
  type: 'network' | 'not_found' | 'permission' | 'server' | 'generic'
  title?: string
  message?: string
  onRetry?: () => void
  showHomeButton?: boolean
}

const errorConfig = {
  network: {
    icon: WifiOff,
    defaultTitle: 'Connexion perdue',
    defaultMessage: 'Vérifie ta connexion internet',
    color: '#f5a623',
    bgColor: 'rgba(245, 166, 35, 0.1)',
    borderColor: 'rgba(245, 166, 35, 0.2)',
  },
  not_found: {
    icon: FileQuestion,
    defaultTitle: 'Page introuvable',
    defaultMessage: 'Cette page n\'existe pas ou a été déplacée',
    color: '#60a5fa',
    bgColor: 'rgba(96, 165, 250, 0.1)',
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  permission: {
    icon: ShieldX,
    defaultTitle: 'Accès refusé',
    defaultMessage: 'Tu n\'as pas les droits pour voir ça',
    color: '#f87171',
    bgColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  server: {
    icon: ServerCrash,
    defaultTitle: 'Erreur serveur',
    defaultMessage: 'Nos serveurs font une pause. Réessaie dans quelques instants',
    color: '#a78bfa',
    bgColor: 'rgba(167, 139, 250, 0.1)',
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  generic: {
    icon: AlertTriangle,
    defaultTitle: 'Quelque chose s\'est mal passé',
    defaultMessage: 'Une erreur inattendue s\'est produite',
    color: '#94a3b8',
    bgColor: 'rgba(148, 163, 184, 0.1)',
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
}

export function ErrorState({
  type,
  title,
  message,
  onRetry,
  showHomeButton = false
}: ErrorStateProps) {
  const navigate = useNavigate()
  const config = errorConfig[type]
  const Icon = config.icon

  const displayTitle = title || config.defaultTitle
  const displayMessage = message || config.defaultMessage

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[400px] px-6 py-12 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Icon container with glow effect */}
      <motion.div
        className="relative mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        {/* Glow background */}
        <motion.div
          className="absolute inset-0 rounded-full blur-xl"
          style={{ backgroundColor: config.bgColor }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Icon wrapper with pulse animation */}
        <motion.div
          className="relative w-24 h-24 flex items-center justify-center rounded-2xl border"
          style={{
            backgroundColor: config.bgColor,
            borderColor: config.borderColor,
          }}
          animate={{
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <Icon
            className="w-10 h-10"
            style={{ color: config.color }}
            strokeWidth={1.5}
          />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h2
        className="text-xl font-semibold text-text-primary mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {displayTitle}
      </motion.h2>

      {/* Message */}
      <motion.p
        className="text-text-secondary text-[15px] max-w-sm mb-8 leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {displayMessage}
      </motion.p>

      {/* Action buttons */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        {onRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            className="min-w-[160px]"
          >
            <RefreshCcw className="w-4 h-4" />
            Réessayer
          </Button>
        )}

        {showHomeButton && (
          <Button
            variant="secondary"
            onClick={() => navigate('/home')}
            className="min-w-[160px]"
          >
            <Home className="w-4 h-4" />
            Retour à l'accueil
          </Button>
        )}
      </motion.div>
    </motion.div>
  )
}

// Convenience components for common use cases
export function NetworkError({ onRetry, showHomeButton }: Omit<ErrorStateProps, 'type'>) {
  return <ErrorState type="network" onRetry={onRetry} showHomeButton={showHomeButton} />
}

export function NotFoundError({ onRetry, showHomeButton }: Omit<ErrorStateProps, 'type'>) {
  return <ErrorState type="not_found" onRetry={onRetry} showHomeButton={showHomeButton} />
}

export function PermissionError({ onRetry, showHomeButton }: Omit<ErrorStateProps, 'type'>) {
  return <ErrorState type="permission" onRetry={onRetry} showHomeButton={showHomeButton} />
}

export function ServerError({ onRetry, showHomeButton }: Omit<ErrorStateProps, 'type'>) {
  return <ErrorState type="server" onRetry={onRetry} showHomeButton={showHomeButton} />
}

export function GenericError({ onRetry, showHomeButton, title, message }: Omit<ErrorStateProps, 'type'>) {
  return <ErrorState type="generic" onRetry={onRetry} showHomeButton={showHomeButton} title={title} message={message} />
}
