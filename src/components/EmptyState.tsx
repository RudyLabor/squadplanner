import { motion } from 'framer-motion'
import {
  Inbox, Calendar, Users, MessageCircle, Trophy, Zap,
  Bell, Search, FolderOpen
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
}> = {
  no_squads: {
    icon: <Users className="w-12 h-12" />,
    title: "Pas encore de squad",
    message: "Crée ta première squad et invite tes potes à jouer !",
    color: '#a855f7'
  },
  no_sessions: {
    icon: <Calendar className="w-12 h-12" />,
    title: "Aucune session prévue",
    message: "Planifie une session de jeu avec ta squad",
    color: '#22d3ee'
  },
  no_messages: {
    icon: <MessageCircle className="w-12 h-12" />,
    title: "Pas de messages",
    message: "Commence une conversation avec ta squad !",
    color: '#4ade80'
  },
  no_friends: {
    icon: <Users className="w-12 h-12" />,
    title: "Aucun ami en ligne",
    message: "Tes potes sont sûrement occupés. Invite-les à jouer !",
    color: '#f59e0b'
  },
  no_achievements: {
    icon: <Trophy className="w-12 h-12" />,
    title: "Pas encore d'achievements",
    message: "Participe à des sessions pour débloquer des badges !",
    color: '#eab308'
  },
  no_challenges: {
    icon: <Zap className="w-12 h-12" />,
    title: "Aucun défi disponible",
    message: "Reviens demain pour de nouveaux défis !",
    color: '#ec4899'
  },
  no_notifications: {
    icon: <Bell className="w-12 h-12" />,
    title: "Pas de notifications",
    message: "Tu es à jour ! Aucune notification pour le moment.",
    color: '#6366f1'
  },
  no_search_results: {
    icon: <Search className="w-12 h-12" />,
    title: "Aucun résultat",
    message: "Essaie avec d'autres mots-clés",
    color: '#8b5cf6'
  },
  empty_folder: {
    icon: <FolderOpen className="w-12 h-12" />,
    title: "Dossier vide",
    message: "Il n'y a rien ici pour le moment",
    color: '#64748b'
  },
  generic: {
    icon: <Inbox className="w-12 h-12" />,
    title: "Rien à afficher",
    message: "Il n'y a rien ici pour le moment",
    color: '#64748b'
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
        className="text-lg font-semibold text-[#f7f8f8] mb-2"
      >
        {title || config.title}
      </motion.h3>

      {/* Message */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="text-sm text-[#5e6063] max-w-xs mb-6"
      >
        {message || config.message}
      </motion.p>

      {/* CTA Button with pulse glow */}
      {actionLabel && onAction && (
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
              color: '#fff'
            }}
          >
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

export default EmptyState
