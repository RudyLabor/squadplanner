import { motion } from 'framer-motion'
import {
  Inbox, Users, Trophy,
  Search, FolderOpen, UserPlus, CalendarPlus, Send,
  PartyPopper, Gamepad2
} from 'lucide-react'
import { Button } from './ui'

type EmptyStateType =
  | 'no_squads'
  | 'no_sessions'
  | 'no_messages'
  | 'no_friends'
  | 'no_achievements'
  | 'no_challenges'
  | 'no_notifications'
  | 'no_search_results'
  | 'empty_folder'
  | 'generic'

interface EmptyStateProps {
  type?: EmptyStateType
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
}

const EMPTY_STATE_CONFIG: Record<EmptyStateType, {
  icon: React.ReactNode
  title: string
  message: string
  color: string
  defaultActionLabel?: string
}> = {
  no_squads: {
    icon: <Users className="w-12 h-12" />,
    title: "Pas encore de squad",
    message: "Crée ta première squad et invite tes potes à jouer !",
    color: 'var(--color-purple)',
    defaultActionLabel: 'Créer ma squad'
  },
  no_sessions: {
    icon: <CalendarPlus className="w-12 h-12" />,
    title: "Aucune session prévue",
    message: "Ta squad t'attend ! Planifie une session et fini les « on verra ».",
    color: 'var(--color-info)',
    defaultActionLabel: 'Planifier maintenant'
  },
  no_messages: {
    icon: <Send className="w-12 h-12" />,
    title: "Pas encore de messages",
    message: "Envoie le premier message à ta squad pour lancer la conversation !",
    color: 'var(--color-success)'
  },
  no_friends: {
    icon: <UserPlus className="w-12 h-12" />,
    title: "Aucun pote en ligne",
    message: "Personne n'est connecté pour le moment. Invite tes amis à rejoindre Squad Planner !",
    color: 'var(--color-warning)',
    defaultActionLabel: 'Invite tes amis'
  },
  no_achievements: {
    icon: <Trophy className="w-12 h-12" />,
    title: "Pas encore de succès",
    message: "Participe à des sessions et relève des défis pour débloquer tes premiers badges !",
    color: 'var(--color-warning)',
    defaultActionLabel: 'Voir les sessions'
  },
  no_challenges: {
    icon: <Gamepad2 className="w-12 h-12" />,
    title: "Aucun défi disponible",
    message: "Les défis se renouvellent chaque jour. Reviens demain pour de nouvelles missions !",
    color: 'var(--color-error)'
  },
  no_notifications: {
    icon: <PartyPopper className="w-12 h-12" />,
    title: "Tout est lu !",
    message: "Aucune notification en attente. Profites-en pour planifier ta prochaine session.",
    color: 'var(--color-primary)'
  },
  no_search_results: {
    icon: <Search className="w-12 h-12" />,
    title: "Aucun résultat",
    message: "Essaie avec d'autres mots-clés ou vérifie l'orthographe.",
    color: 'var(--color-purple)'
  },
  empty_folder: {
    icon: <FolderOpen className="w-12 h-12" />,
    title: "Dossier vide",
    message: "Il n'y a rien ici pour le moment",
    color: 'var(--color-text-tertiary)'
  },
  generic: {
    icon: <Inbox className="w-12 h-12" />,
    title: "Rien à afficher",
    message: "Il n'y a rien ici pour le moment",
    color: 'var(--color-text-tertiary)'
  }
}

export function EmptyState({
  type = 'generic',
  title,
  message,
  actionLabel,
  onAction,
  icon
}: EmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, type: 'spring', stiffness: 200 }}
        className="relative mb-6"
      >
        {/* Glow background */}
        <motion.div
          className="absolute inset-0 rounded-full blur-xl opacity-30"
          style={{ backgroundColor: config.color }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Icon container */}
        <motion.div
          className="relative w-24 h-24 rounded-2xl flex items-center justify-center"
          style={{
            backgroundColor: `${config.color}15`,
            color: config.color
          }}
          animate={{
            y: [0, -8, 0]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {icon || config.icon}
        </motion.div>
      </motion.div>

      {/* Title with staggered animation */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-lg font-semibold text-text-primary mb-2"
      >
        {title || config.title}
      </motion.h3>

      {/* Message */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="text-sm text-text-tertiary max-w-xs mb-6"
      >
        {message || config.message}
      </motion.p>

      {/* CTA Button with pulse glow */}
      {(actionLabel || config.defaultActionLabel) && onAction && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="relative"
        >
          {/* Pulse glow behind button */}
          <motion.div
            className="absolute inset-0 rounded-xl blur-md"
            style={{ backgroundColor: config.color }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />

          <Button
            onClick={onAction}
            className="relative"
            style={{
              backgroundColor: config.color,
              color: 'var(--color-text-primary)'
            }}
          >
            {actionLabel || config.defaultActionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

export default EmptyState
