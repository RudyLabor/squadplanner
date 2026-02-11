import { memo } from 'react'
import { Link } from 'react-router-dom'
import { m, AnimatePresence } from 'framer-motion'
import { User, Zap } from 'lucide-react'
import { getOptimizedAvatarUrl } from '../../utils/avatarUrl'
import { Tooltip } from '../ui/Tooltip'
import { StatusSelector } from '../StatusSelector'

interface SidebarFooterProps {
  isExpanded: boolean
  profile: { username?: string | null; avatar_url?: string | null; reliability_score?: number | null } | null
  onOpenCustomStatus: () => void
}

export const SidebarFooter = memo(function SidebarFooter({
  isExpanded,
  profile,
  onOpenCustomStatus,
}: SidebarFooterProps) {
  return (
    <footer className="mt-auto">
      <div className={`${isExpanded ? 'p-4' : 'p-2'} border-t border-surface-card`}>
        {!isExpanded ? (
          <Tooltip content={profile?.username || 'Mon profil'} position="right" delay={300}>
            <Link to="/profile" aria-label="Voir mon profil">
              <m.div
                className="flex items-center justify-center p-2 rounded-xl hover:bg-surface-card transition-colors duration-300"
                whileHover={{ x: 0 }}
                transition={{ duration: 0.25 }}
              >
                {profile?.avatar_url ? (
                  <img
                    src={getOptimizedAvatarUrl(profile.avatar_url, 32) || profile.avatar_url}
                    alt={profile.username || 'Avatar'}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-purple/8 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-purple" />
                  </div>
                )}
              </m.div>
            </Link>
          </Tooltip>
        ) : (
          <>
            <Link to="/profile" aria-label="Voir mon profil">
              <m.div
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-card transition-colors duration-300"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.25 }}
              >
                {profile?.avatar_url ? (
                  <img
                    src={getOptimizedAvatarUrl(profile.avatar_url, 40) || profile.avatar_url}
                    alt={profile.username || 'Avatar'}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple/8 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-purple" />
                  </div>
                )}
                <m.div
                  key="profile-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 min-w-0"
                >
                  <div className="text-md font-medium text-text-primary truncate">
                    {profile?.username || 'Mon profil'}
                  </div>
                  <div className="text-sm text-text-tertiary">
                    {profile?.reliability_score || 100}% fiable
                  </div>
                </m.div>
              </m.div>
            </Link>
            <StatusSelector
              onOpenCustomStatus={onOpenCustomStatus}
              className="mt-1 px-1"
            />
          </>
        )}
      </div>

      {/* Premium upsell */}
      <AnimatePresence>
        {isExpanded && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 overflow-hidden"
          >
            <Link to="/premium" aria-label="Passer Premium - Stats avancées, IA coach, qualité audio HD">
              <m.div
                className="p-4 rounded-xl bg-gradient-to-br from-primary-10 to-purple/3 border border-primary/10 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-warning" />
                  <span className="text-base font-semibold text-text-primary">Passe Premium</span>
                </div>
                <p className="text-sm text-text-secondary mb-3">
                  Stats avancées, IA coach, qualité audio HD
                </p>
                <span className="text-sm font-semibold text-primary hover:text-purple transition-colors duration-300">
                  Découvrir →
                </span>
              </m.div>
            </Link>
          </m.div>
        )}
      </AnimatePresence>

      {/* Collapsed Premium icon */}
      {!isExpanded && (
        <div className="p-2 pb-4">
          <Tooltip content="Passer Premium" position="right" delay={300}>
            <Link to="/premium" aria-label="Passer Premium">
              <m.div
                className="flex items-center justify-center p-2 rounded-xl hover:bg-surface-card transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Zap className="w-5 h-5 text-warning" />
              </m.div>
            </Link>
          </Tooltip>
        </div>
      )}
    </footer>
  )
})
