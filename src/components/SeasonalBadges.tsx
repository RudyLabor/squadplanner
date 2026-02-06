import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Crown, Flame, Star, Zap, Target, Award, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../hooks'

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
    color: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.15)',
    glowColor: 'rgba(251, 191, 36, 0.3)',
    label: 'MVP',
    description: 'Meilleur joueur du mois'
  },
  most_reliable: {
    icon: Target,
    color: '#34d399',
    bgColor: 'rgba(52, 211, 153, 0.15)',
    glowColor: 'rgba(52, 211, 153, 0.3)',
    label: 'Most Reliable',
    description: 'Plus fiable du mois'
  },
  party_animal: {
    icon: Flame,
    color: '#f472b6',
    bgColor: 'rgba(244, 114, 182, 0.15)',
    glowColor: 'rgba(244, 114, 182, 0.3)',
    label: 'Party Animal',
    description: 'Le plus actif en party'
  },
  top_scorer: {
    icon: Star,
    color: '#a78bfa',
    bgColor: 'rgba(167, 139, 250, 0.15)',
    glowColor: 'rgba(167, 139, 250, 0.3)',
    label: 'Top Scorer',
    description: 'Plus de XP gagné'
  },
  streak_master: {
    icon: Zap,
    color: '#22d3ee',
    bgColor: 'rgba(34, 211, 238, 0.15)',
    glowColor: 'rgba(34, 211, 238, 0.3)',
    label: 'Streak Master',
    description: 'Plus longue série'
  },
  squad_champion: {
    icon: Trophy,
    color: '#fb923c',
    bgColor: 'rgba(251, 146, 60, 0.15)',
    glowColor: 'rgba(251, 146, 60, 0.3)',
    label: 'Squad Champion',
    description: 'Champion de la squad'
  },
  rising_star: {
    icon: Sparkles,
    color: '#818cf8',
    bgColor: 'rgba(129, 140, 248, 0.15)',
    glowColor: 'rgba(129, 140, 248, 0.3)',
    label: 'Rising Star',
    description: 'Progression exceptionnelle'
  },
  legend: {
    icon: Award,
    color: '#f43f5e',
    bgColor: 'rgba(244, 63, 94, 0.15)',
    glowColor: 'rgba(244, 63, 94, 0.3)',
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
}

export function SeasonalBadges({ userId, compact = false }: SeasonalBadgesProps) {
  const { user } = useAuthStore()
  const [badges, setBadges] = useState<SeasonalBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBadge, setSelectedBadge] = useState<SeasonalBadge | null>(null)

  const targetUserId = userId || user?.id

  useEffect(() => {
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
  }, [targetUserId])

  if (loading) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.03)] animate-pulse"
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
          <div className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center">
            <Trophy className="w-6 h-6 text-[#3a3a3f]" />
          </div>
        </div>
        <p className="text-[#5e6063] text-sm">Pas encore de badges saisonniers</p>
        <p className="text-[#3a3a3f] text-xs mt-1">Continue à jouer pour en débloquer !</p>
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
              <motion.button
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className="relative w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: config.bgColor }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title={`${config.label} - ${formatSeason(badge.season)}`}
              >
                <Icon className="w-5 h-5" style={{ color: config.color }} />
              </motion.button>
            )
          })}
          {badges.length > 6 && (
            <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,0.03)] flex items-center justify-center text-[#5e6063] text-sm font-medium">
              +{badges.length - 6}
            </div>
          )}
        </div>
      ) : (
        // Full view - grouped by season
        <div className="space-y-4">
          {Object.entries(badgesBySeason).map(([season, seasonBadges]) => (
            <div key={season}>
              <h4 className="text-[12px] font-semibold text-[#8b8d90] uppercase tracking-wider mb-2">
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
                        <div className="px-2 py-1 rounded-lg bg-[#1a1a1e] border border-[rgba(255,255,255,0.08)] text-[10px] text-[#f7f8f8] whitespace-nowrap">
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
                  <div className="bg-[#0a0a0b] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 text-center">
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
                    <h3 className="text-xl font-bold text-[#f7f8f8] mb-1">
                      {config.label}
                    </h3>
                    <p className="text-[#8b8d90] text-sm mb-4">
                      {config.description}
                    </p>

                    {/* Season and squad info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center py-2 border-t border-[rgba(255,255,255,0.05)]">
                        <span className="text-[#5e6063]">Saison</span>
                        <span className="text-[#f7f8f8] font-medium">
                          {formatSeason(selectedBadge.season)}
                        </span>
                      </div>
                      {selectedBadge.squad_name && (
                        <div className="flex justify-between items-center py-2 border-t border-[rgba(255,255,255,0.05)]">
                          <span className="text-[#5e6063]">Squad</span>
                          <span className="text-[#f7f8f8] font-medium">
                            {selectedBadge.squad_name}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-2 border-t border-[rgba(255,255,255,0.05)]">
                        <span className="text-[#5e6063]">Obtenu le</span>
                        <span className="text-[#f7f8f8] font-medium">
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
                      className="mt-6 w-full py-3 rounded-xl bg-[rgba(255,255,255,0.05)] text-[#f7f8f8] font-medium hover:bg-[rgba(255,255,255,0.08)] transition-colors"
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
