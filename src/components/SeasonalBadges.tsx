import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../hooks'
import { Tooltip } from './ui/Tooltip'
import { BADGE_CONFIGS, formatSeason, type SeasonalBadge } from './badges/badgeConfig'
import { BadgeDetailModal } from './badges/BadgeDetailModal'

interface SeasonalBadgesProps {
  userId?: string
  compact?: boolean
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
  const [loading, setLoading] = useState(!initialBadges)
  const [selectedBadge, setSelectedBadge] = useState<SeasonalBadge | null>(null)

  const targetUserId = userId || user?.id

  useEffect(() => {
    if (initialBadges) {
      const formattedBadges = initialBadges.map((b) => ({
        id: b.id, user_id: b.user_id, badge_type: b.badge_type, season: b.season,
        squad_id: b.squad_id, awarded_at: b.awarded_at, squad_name: b.squads?.name
      }))
      setBadges(formattedBadges)
      setLoading(false)
      return
    }

    if (!targetUserId) return

    const fetchBadges = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('seasonal_badges')
          .select('id, user_id, badge_type, season, squad_id, awarded_at, squads(name)')
          .eq('user_id', targetUserId)
          .order('awarded_at', { ascending: false })

        if (error) throw error

        const formattedBadges = (data || []).map((b) => {
          const squadsData = b.squads as { name: string } | { name: string }[] | null
          const squadName = Array.isArray(squadsData) ? squadsData[0]?.name : squadsData?.name
          return { ...b, squad_name: squadName } as SeasonalBadge
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
          {[1, 2, 3].map(i => <div key={i} className="w-12 h-12 rounded-xl bg-surface-card animate-pulse" />)}
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

  const badgesBySeason = badges.reduce((acc, badge) => {
    if (!acc[badge.season]) acc[badge.season] = []
    acc[badge.season].push(badge)
    return acc
  }, {} as Record<string, SeasonalBadge[]>)

  return (
    <div className={compact ? 'p-3' : 'p-4'}>
      {compact ? (
        <div className="flex flex-wrap gap-2">
          {badges.slice(0, 6).map((badge) => {
            const config = BADGE_CONFIGS[badge.badge_type] || BADGE_CONFIGS.mvp
            const Icon = config.icon
            return (
              <Tooltip key={badge.id} content={`${config.label} - ${formatSeason(badge.season)}`} position="top" delay={300}>
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
                    <motion.button key={badge.id} onClick={() => setSelectedBadge(badge)} className="relative group" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-shadow" style={{ backgroundColor: config.bgColor, boxShadow: `0 0 20px ${config.glowColor}` }}>
                        <Icon className="w-7 h-7" style={{ color: config.color }} />
                      </div>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="px-2 py-1 rounded-lg bg-bg-hover border border-border-hover text-xs text-text-primary whitespace-nowrap">{config.label}</div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <BadgeDetailModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
    </div>
  )
}
