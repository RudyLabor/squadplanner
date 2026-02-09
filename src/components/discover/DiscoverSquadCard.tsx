import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Star, Copy, Check, Gamepad2 } from 'lucide-react'
import type { PublicSquadResult } from '../../types/database'
import { toast } from 'sonner'

interface Props {
  squad: PublicSquadResult
}

export const DiscoverSquadCard = memo(function DiscoverSquadCard({ squad }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(squad.invite_code)
      setCopied(true)
      toast.success('Code copie ! Utilise-le pour rejoindre.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Impossible de copier')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border-subtle bg-surface-card hover:bg-surface-card-hover transition-colors p-4"
    >
      <div className="flex items-start gap-3">
        {/* Squad icon */}
        <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
          <Gamepad2 className="w-5 h-5 text-indigo-400" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Name & game */}
          <h3 className="text-sm font-semibold text-text-primary truncate">{squad.name}</h3>
          <p className="text-xs text-indigo-400 font-medium">{squad.game}</p>

          {/* Description */}
          {squad.description && (
            <p className="text-xs text-text-tertiary mt-1 line-clamp-2">{squad.description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
              <Users className="w-3 h-3" />
              {squad.member_count} membres
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
              <Star className="w-3 h-3 text-amber-400" />
              {Math.round(squad.avg_reliability)}%
            </span>
            {squad.region && (
              <span className="text-xs text-text-tertiary capitalize">{squad.region}</span>
            )}
          </div>

          {/* Tags */}
          {squad.tags && squad.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {squad.tags.map(tag => (
                <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-overlay-subtle text-text-tertiary">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Join button */}
        <button
          onClick={handleCopyCode}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-medium transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copie !' : 'Rejoindre'}
        </button>
      </div>

      {/* Owner */}
      <div className="mt-3 pt-3 border-t border-border-subtle flex items-center gap-2">
        {squad.owner_avatar ? (
          <img src={squad.owner_avatar} alt="" className="w-4 h-4 rounded-full" loading="lazy" decoding="async" />
        ) : (
          <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <span className="text-[8px] text-indigo-400 font-bold">{squad.owner_username?.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <span className="text-sm text-text-tertiary">Cree par {squad.owner_username}</span>
      </div>
    </motion.div>
  )
})
