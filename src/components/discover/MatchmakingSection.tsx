
import { memo, useState } from 'react'
import { m } from 'framer-motion'
import { Users, Shield, Star, Gamepad2, MapPin, MessageSquare } from '../icons'
import { useMatchmakingQuery } from '../../hooks/queries'
import { useAuthStore } from '../../hooks'
import { supabaseMinimal as supabase } from '../../lib/supabaseMinimal'
import { showSuccess, showError } from '../../lib/toast'
import type { MatchmakingPlayer } from '../../types/database'

interface Props {
  game?: string
  region?: string
}

export const MatchmakingSection = memo(function MatchmakingSection({ game, region }: Props) {
  const { data: players, isLoading } = useMatchmakingQuery(game, region)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-overlay-faint animate-pulse" />
        ))}
      </div>
    )
  }

  if (!players || players.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Personne en recherche de squad pour le moment
        </h3>
        <p className="text-md text-text-secondary max-w-sm mx-auto mb-6">
          Active la recherche de squad dans ton profil pour apparaître ici et être trouvé par
          d'autres joueurs.
        </p>
        <a
          href="/profile"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-md font-medium hover:bg-primary-hover transition-colors"
        >
          Activer dans mon profil
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {players.map((player) => (
        <PlayerCard key={player.user_id} player={player} />
      ))}
    </div>
  )
})

const PlayerCard = memo(function PlayerCard({ player }: { player: MatchmakingPlayer }) {
  const { user } = useAuthStore()
  const [inviting, setInviting] = useState(false)

  const handleInvite = async () => {
    if (!user || inviting) return
    setInviting(true)

    try {
      // Send a DM with invite
      await supabase.from('direct_messages').insert({
        sender_id: user.id,
        receiver_id: player.user_id,
        content: `Salut ${player.username} ! Je t'invite \u00e0 rejoindre ma squad. Int\u00e9ress\u00e9(e) ?`,
      })
      showSuccess(`Message envoy\u00e9 \u00e0 ${player.username} !`)
    } catch {
      showError("Erreur lors de l'envoi")
    } finally {
      setInviting(false)
    }
  }

  const isOwnProfile = user?.id === player.user_id

  return (
    <m.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border-subtle bg-surface-card p-4"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {player.avatar_url ? (
          <img
            src={player.avatar_url}
            alt=""
            className="w-10 h-10 rounded-full flex-shrink-0"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-indigo-400">
              {player.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-text-primary">{player.username}</h4>
            <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-medium">
              Nv.{player.level}
            </span>
          </div>

          {player.bio && (
            <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{player.bio}</p>
          )}

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
              <Shield className="w-3 h-3 text-emerald-400" />
              {Math.round(player.reliability_score)}%
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
              <Star className="w-3 h-3 text-amber-400" />
              {player.xp.toLocaleString()} XP
            </span>
            {player.region && (
              <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                <MapPin className="w-3 h-3" />
                {player.region}
              </span>
            )}
            {player.playstyle && (
              <span className="text-xs text-text-tertiary capitalize">{player.playstyle}</span>
            )}
          </div>

          {/* Preferred games */}
          {player.preferred_games && player.preferred_games.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {player.preferred_games.slice(0, 4).map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-overlay-subtle text-text-tertiary"
                >
                  <Gamepad2 className="w-2.5 h-2.5" />
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Invite button */}
        {!isOwnProfile && (
          <button
            onClick={handleInvite}
            disabled={inviting}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {inviting ? '...' : 'Inviter'}
          </button>
        )}
      </div>
    </m.div>
  )
})
