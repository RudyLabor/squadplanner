import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Crown, Flame, Star, Zap, Target, Award, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../hooks'
import { Tooltip } from './ui/Tooltip'

interface SeasonalBadge {
  id: string
  user_id: string
  badge_type: string
  season: string
  squad_id: string | null
  awarded_at: string
  squad_name?: string
}

interface BadgeConfig {
  icon: React.ElementType
  color: string
  bgColor: string
  glowColor: string
  label: string
  description: string
}

const BADGE_CONFIGS: Record<string, BadgeConfig> = {
  mvp: {
    icon: Crown,
    color: 'var(--color-warning)',
    bgColor: 'var(--color-warning-15)',
    glowColor: 'var(--color-warning-30)',
    label: 'MVP',
    description: 'Meilleur joueur du mois'
  },
  most_reliable: {
    icon: Target,
    color: 'var(--color-success)',
    bgColor: 'var(--color-success-15)',
    glowColor: 'var(--color-success-30)',
    label: 'Plus fiable',
    description: 'Plus fiable du mois'
  },
  party_animal: {
    icon: Flame,
    color: 'var(--color-pink)',
    bgColor: 'var(--color-pink-15)',
    glowColor: 'var(--color-pink-30)',
    label: 'Bête de soirée',
    description: 'Le plus actif en party'
  },
  top_scorer: {
    icon: Star,
    color: 'var(--color-purple)',
    bgColor: 'var(--color-purple-15)',
    glowColor: 'var(--color-purple-20)',
    label: 'Meilleur scoreur',
    description: 'Plus de XP gagné'
  },
  streak_master: {
    icon: Zap,
    color: 'var(--color-cyan)',
    bgColor: 'var(--color-cyan-15)',
    glowColor: 'var(--color-cyan-30)',
    label: 'Maître de la série',
    description: 'Plus longue série'
  },
  squad_champion: {
    icon: Trophy,
    color: 'var(--color-orange)',
    bgColor: 'var(--color-orange-15)',
    glowColor: 'var(--color-orange-30)',
    label: 'Champion de squad',
    description: 'Champion de la squad'
  },
  rising_star: {
    icon: Sparkles,
    color: 'var(--color-primary-hover)',
    bgColor: 'var(--color-primary-hover-15)',
    glowColor: 'var(--color-primary-hover-30)',
    label: 'Étoile montante',
    description: 'Progression exceptionnelle'
  },
  legend: {
    icon: Award,
    color: 'var(--color-rose)',
    bgColor: 'var(--color-rose-15)',
    glowColor: 'var(--color-rose-30)',
    label: 'Légende',
    description: 'Statut légendaire atteint'
  }
}

function formatSeason(season: string): string {
  // Format: "2026-02" -> "Février 2026"
  const [year, month] = season.split('-')
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]
  const monthIndex = parseInt(month, 10) - 1
  return `${months[monthIndex]} ${year}`
}

interface SeasonalBadgesProps {
  userId?: string
  compact?: boolean
  // Optional: pass badges directly to avoid duplicate API calls
  initialBadges?: Array<{
    id: string
    user_id: string
    badge_type: string
    season: string
    squad_id: string | null
    awarded_at: string
    squads?: { name: string } | null
  }>
}

export function SeasonalBadges({ userId, compact = false, initialBadges }: SeasonalBadgesProps) {
  const { user } = useAuthStore()
  const [badges, setBadges] = useState<SeasonalBadge[]>([])
  const [loading, setLoading] = useState(!initialBadges) // Don't show loading if we have initial data
  const [selectedBadge, setSelectedBadge] = useState<SeasonalBadge | null>(null)

  const targetUserId = userId || user?.id

  // If badges are passed as props, use them directly (avoids duplicate API call)
  useEffect(() => {
    if (initialBadges) {
      const formattedBadges = initialBadges.map((b) => ({
        id: b.id,
        user_id: b.user_id,
        badge_type: b.badge_type,
        season: b.season,
        squad_id: b.squad_id,
        awarded_at: b.awarded_at,
        squad_name: b.squads?.name
      }))
      setBadges(formattedBadges)
      setLoading(false)
      return
    }

    // Only fetch if no initial badges provided
    if (!targetUserId) return

    const fetchBadges = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('seasonal_badges')
          .select(`
            id,
            user_id,
            badge_type,
            season,
            squad_id,
            awarded_at,
            squads(name)
          `)
          .eq('user_id', targetUserId)
          .order('awarded_at', { ascending: false })

        if (error) throw error

        const formattedBadges = (data || []).map((b) => {
          const squadsData = b.squads as { name: string } | { name: string }[] | null
          const squadName = Array.isArray(squadsData) ? squadsData[0]?.name : squadsData?.name
          return {
            ...b,
            squad_name: squadName
          } as SeasonalBadge
        })

        setBadges(formattedBadges)
      } catch (error) {
        console.error('Error fetching seasonal badges:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBadges()
  }, [targetUserId, initialBadges])

  if (loading) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="w-12 h-12 rounded-xl bg-surface-card animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (badges.length === 0) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} text-center`}>
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-xl bg-surface-card flex items-center justify-center">
            <Trophy className="w-6 h-6 text-text-tertiary" />
          </div>
        </div>
        <p className="text-text-tertiary text-sm">Pas encore de badges saisonniers</p>
        <p className="text-text-tertiary text-xs mt-1">Continue à jouer pour en débloquer !</p>
      </div>
    )
  }

  // Group badges by season
  const badgesBySeason = badges.reduce((acc, badge) => {
    const season = badge.season
    if (!acc[season]) acc[season] = []
    acc[season].push(badge)
    return acc
  }, {} as Record<string, SeasonalBadge[]>)

  return (
    <div className={compact ? 'p-3' : 'p-4'}>
      {compact ? (
        // Compact view - just icons
        <div className="flex flex-wrap gap-2">
          {badges.slice(0, 6).map((badge) => {
            const config = BADGE_CONFIGS[badge.badge_type] || BADGE_CONFIGS.mvp
            const Icon = config.icon
            return (
              <Tooltip
                key={badge.id}
                content={`${config.label} - ${formatSeason(badge.season)}`}
                position="top"
                delay={300}
              >
                <motion.button
                  onClick={() => setSelectedBadge(badge)}
                  className="relative w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: config.bgColor }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`${config.label} - ${formatSeason(badge.season)}`}
                >
                  <Icon className="w-5 h-5" style={{ color: config.color }} />
                </motion.button>
              </Tooltip>
            )
          })}
          {badges.length > 6 && (
            <div className="w-10 h-10 rounded-lg bg-surface-card flex items-center justify-center text-text-tertiary text-sm font-medium">
              +{badges.length - 6}
            </div>
          )}
        </div>
      ) : (
        // Full view - grouped by season
        <div className="space-y-4">
          {Object.entries(badgesBySeason).map(([season, seasonBadges]) => (
            <div key={season}>
              <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
                {formatSeason(season)}
              </h4>
              <div className="flex flex-wrap gap-3">
                {seasonBadges.map((badge) => {
                  const config = BADGE_CONFIGS[badge.badge_type] || BADGE_CONFIGS.mvp
                  const Icon = config.icon
                  return (
                    <motion.button
                      key={badge.id}
                      onClick={() => setSelectedBadge(badge)}
                      className="relative group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center transition-shadow"
                        style={{
                          backgroundColor: config.bgColor,
                          boxShadow: `0 0 20px ${config.glowColor}`
                        }}
                      >
                        <Icon className="w-7 h-7" style={{ color: config.color }} />
                      </div>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="px-2 py-1 rounded-lg bg-bg-hover border border-border-hover text-xs text-text-primary whitespace-nowrap">
                          {config.label}
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Badge detail modal */}
      <AnimatePresence>
        {selectedBadge && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setSelectedBadge(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50 px-4"
            >
              {(() => {
                const config = BADGE_CONFIGS[selectedBadge.badge_type] || BADGE_CONFIGS.mvp
                const Icon = config.icon
                return (
                  <div className="bg-bg-elevated border border-border-hover rounded-2xl p-6 text-center">
                    {/* Badge icon with glow */}
                    <motion.div
                      className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center mb-4"
                      style={{
                        backgroundColor: config.bgColor,
                        boxShadow: `0 0 40px ${config.glowColor}`
                      }}
                      animate={{
                        boxShadow: [
                          `0 0 40px ${config.glowColor}`,
                          `0 0 60px ${config.glowColor}`,
                          `0 0 40px ${config.glowColor}`
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Icon className="w-12 h-12" style={{ color: config.color }} />
                    </motion.div>

                    {/* Badge info */}
                    <h3 className="text-xl font-bold text-text-primary mb-1">
                      {config.label}
                    </h3>
                    <p className="text-text-secondary text-sm mb-4">
                      {config.description}
                    </p>

                    {/* Season and squad info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center py-2 border-t border-border-subtle">
                        <span className="text-text-tertiary">Saison</span>
                        <span className="text-text-primary font-medium">
                          {formatSeason(selectedBadge.season)}
                        </span>
                      </div>
                      {selectedBadge.squad_name && (
                        <div className="flex justify-between items-center py-2 border-t border-border-subtle">
                          <span className="text-text-tertiary">Squad</span>
                          <span className="text-text-primary font-medium">
                            {selectedBadge.squad_name}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-2 border-t border-border-subtle">
                        <span className="text-text-tertiary">Obtenu le</span>
                        <span className="text-text-primary font-medium">
                          {new Date(selectedBadge.awarded_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Close button */}
                    <motion.button
                      onClick={() => setSelectedBadge(null)}
                      className="mt-6 w-full py-3 rounded-xl bg-border-subtle text-text-primary font-medium hover:bg-overlay-light transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Fermer
                    </motion.button>
                  </div>
                )
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
