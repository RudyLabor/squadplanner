import { m, AnimatePresence } from 'framer-motion'
import { BADGE_CONFIGS, formatSeason, type SeasonalBadge } from './badgeConfig'

interface BadgeDetailModalProps {
  badge: SeasonalBadge | null
  onClose: () => void
}

export function BadgeDetailModal({ badge, onClose }: BadgeDetailModalProps) {
  return (
    <AnimatePresence>
      {badge && (
        <>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <m.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50 px-4"
          >
            {(() => {
              const config = BADGE_CONFIGS[badge.badge_type] || BADGE_CONFIGS.mvp
              const Icon = config.icon
              return (
                <div className="bg-bg-elevated border border-border-hover rounded-2xl p-6 text-center">
                  <m.div
                    className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: config.bgColor,
                      boxShadow: `0 0 40px ${config.glowColor}`,
                    }}
                    animate={{
                      boxShadow: [
                        `0 0 40px ${config.glowColor}`,
                        `0 0 60px ${config.glowColor}`,
                        `0 0 40px ${config.glowColor}`,
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Icon className="w-12 h-12" style={{ color: config.color }} />
                  </m.div>

                  <h3 className="text-xl font-bold text-text-primary mb-1">{config.label}</h3>
                  <p className="text-text-secondary text-sm mb-4">{config.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-2 border-t border-border-subtle">
                      <span className="text-text-tertiary">Saison</span>
                      <span className="text-text-primary font-medium">
                        {formatSeason(badge.season)}
                      </span>
                    </div>
                    {badge.squad_name && (
                      <div className="flex justify-between items-center py-2 border-t border-border-subtle">
                        <span className="text-text-tertiary">Squad</span>
                        <span className="text-text-primary font-medium">{badge.squad_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-t border-border-subtle">
                      <span className="text-text-tertiary">Obtenu le</span>
                      <span className="text-text-primary font-medium">
                        {new Date(badge.awarded_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <m.button
                    onClick={onClose}
                    className="mt-6 w-full py-3 rounded-xl bg-border-subtle text-text-primary font-medium hover:bg-overlay-light transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Fermer
                  </m.button>
                </div>
              )
            })()}
          </m.div>
        </>
      )}
    </AnimatePresence>
  )
}
