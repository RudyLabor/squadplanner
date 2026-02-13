
import { memo, useState, useMemo } from 'react'
import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Users, Star, Copy, Check, Gamepad2, Eye } from '../icons'
import type { PublicSquadResult } from '../../types/database'
import { showSuccess, showError } from '../../lib/toast'
import { useSquadsStore } from '../../hooks/useSquads'

interface Props {
  squad: PublicSquadResult
}

export const DiscoverSquadCard = memo(function DiscoverSquadCard({ squad }: Props) {
  const [copied, setCopied] = useState(false)
  const { squads: mySquads } = useSquadsStore()
  const isMember = useMemo(() => mySquads.some((s) => s.id === squad.id), [mySquads, squad.id])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(squad.invite_code)
      setCopied(true)
      showSuccess('Code copie ! Utilise-le pour rejoindre.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showError('Impossible de copier')
    }
  }

  // Guard against NaN/undefined for reliability — owner always counts as 1 member minimum
  const reliability =
    Number.isFinite(squad.avg_reliability) && squad.avg_reliability > 0
      ? Math.round(squad.avg_reliability)
      : null
  const memberCount =
    Number.isFinite(squad.member_count) && squad.member_count > 0 ? squad.member_count : 1

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border-subtle bg-surface-card hover:bg-surface-card-hover transition-colors p-4"
    >
      {/* Header: icon + name + game */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
          <Gamepad2 className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate">{squad.name}</h3>
          <p className="text-xs text-indigo-400 font-medium">{squad.game}</p>
        </div>
        {isMember ? (
          <Link
            to="/squads"
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg bg-success/10 hover:bg-success/20 text-success text-xs font-medium transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Voir
          </Link>
        ) : (
          <button
            onClick={handleCopyCode}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copié !' : 'Rejoindre'}
          </button>
        )}
      </div>

      {/* Description */}
      {squad.description && (
        <p className="text-xs text-text-tertiary mb-2 line-clamp-2">{squad.description}</p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-2">
        <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
          <Users className="w-3 h-3" />
          {memberCount} {memberCount === 1 ? 'membre' : 'membres'}
        </span>
        {reliability !== null && (
          <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
            <Star className="w-3 h-3 text-amber-400" />
            {reliability}%
          </span>
        )}
        {squad.region && (
          <span className="text-xs text-text-tertiary capitalize">{squad.region}</span>
        )}
      </div>

      {/* Tags */}
      {squad.tags && squad.tags.length > 0 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {squad.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 rounded bg-overlay-subtle text-text-tertiary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Owner */}
      <div className="pt-2 border-t border-border-subtle flex items-center gap-2">
        {squad.owner_avatar ? (
          <img
            src={squad.owner_avatar}
            alt=""
            className="w-4 h-4 rounded-full"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <span className="text-2xs text-indigo-400 font-bold">
              {(squad.owner_username || '?').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="text-sm text-text-tertiary">
          {`Créé par`} {squad.owner_username || 'un joueur'}
        </span>
      </div>
    </m.div>
  )
})
