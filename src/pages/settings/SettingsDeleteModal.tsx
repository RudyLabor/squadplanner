import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Loader2, Users, Trophy, Zap } from '../../components/icons'
import { supabaseMinimal as supabase } from '../../lib/supabaseMinimal'
import { showError } from '../../lib/toast'

interface SettingsDeleteModalProps {
  isOpen: boolean
  onClose: () => void
}

interface AccountLossStats {
  squadCount: number
  squadNames: string[]
  sessionCount: number
  xp: number
  level: number
}

export function SettingsDeleteModal({ isOpen, onClose }: SettingsDeleteModalProps) {
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [lossStats, setLossStats] = useState<AccountLossStats | null>(null)

  // R19 — Fetch account stats to show what user will lose (Endowment Effect + Loss Aversion)
  useEffect(() => {
    if (!isOpen) return
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const [memberships, profile] = await Promise.all([
          supabase.from('squad_members').select('squad_id, squads(name)').eq('user_id', user.id),
          supabase.from('profiles').select('xp, level, total_sessions').eq('id', user.id).single(),
        ])
        const squadNames = (memberships.data || [])
          .map((m) => {
            const squad = m.squads as unknown as { name: string } | null
            return squad?.name || ''
          })
          .filter(Boolean)
        setLossStats({
          squadCount: squadNames.length,
          squadNames,
          sessionCount: profile.data?.total_sessions || 0,
          xp: profile.data?.xp || 0,
          level: profile.data?.level || 1,
        })
      } catch {
        // Non-critical — proceed without stats
      }
    }
    fetchStats()
  }, [isOpen])

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') return
    setIsDeleting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')
      const userId = user.id
      await supabase.from('session_checkins').delete().eq('user_id', userId)
      await supabase.from('session_rsvps').delete().eq('user_id', userId)
      await supabase.from('messages').delete().eq('user_id', userId)
      await supabase.from('direct_messages').delete().eq('sender_id', userId)
      await supabase.from('party_participants').delete().eq('user_id', userId)
      await supabase.from('push_subscriptions').delete().eq('user_id', userId)
      await supabase.from('squad_members').delete().eq('user_id', userId)
      await supabase.from('ai_insights').delete().eq('user_id', userId)
      await supabase.from('profiles').delete().eq('id', userId)
      await supabase.auth.signOut()
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
    } catch {
      showError('Erreur lors de la suppression. Contacte le support.')
      setIsDeleting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-overlay backdrop-blur-sm"
          onClick={() => !isDeleting && onClose()}
        >
          <m.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-bg-elevated rounded-2xl border border-error/10 p-6 shadow-modal"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-error-10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Supprimer ton compte</h3>
            </div>
            <p className="text-base text-text-tertiary mb-4">
              Cette action est{' '}
              <span className="text-error font-semibold">
                définitive et irréversible
              </span>
              . Toutes tes données seront supprimées.
            </p>

            {/* R19 — Loss recap (Endowment Effect) */}
            {lossStats && (lossStats.squadCount > 0 || lossStats.xp > 0) && (
              <div className="mb-4 p-3 rounded-xl bg-error/[0.04] border border-error/10 space-y-2">
                <p className="text-xs font-semibold text-error uppercase tracking-wide">Tu vas perdre :</p>
                {lossStats.squadCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Users className="w-4 h-4 text-error/60 flex-shrink-0" />
                    <span>
                      {lossStats.squadCount} squad{lossStats.squadCount > 1 ? 's' : ''}
                      {lossStats.squadNames.length > 0 && (
                        <span className="text-text-tertiary"> ({lossStats.squadNames.slice(0, 3).join(', ')}{lossStats.squadNames.length > 3 ? '...' : ''})</span>
                      )}
                    </span>
                  </div>
                )}
                {lossStats.sessionCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Trophy className="w-4 h-4 text-error/60 flex-shrink-0" />
                    <span>{lossStats.sessionCount} session{lossStats.sessionCount > 1 ? 's' : ''} jouée{lossStats.sessionCount > 1 ? 's' : ''}</span>
                  </div>
                )}
                {lossStats.xp > 0 && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Zap className="w-4 h-4 text-error/60 flex-shrink-0" />
                    <span>{lossStats.xp} XP · Niveau {lossStats.level}</span>
                  </div>
                )}
                <p className="text-xs text-text-tertiary italic">
                  Tes coéquipiers vont perdre un joueur fiable.
                </p>
              </div>
            )}

            <p className="text-base text-text-tertiary mb-3">
              Tape <span className="font-mono text-error font-bold">SUPPRIMER</span> pour confirmer
              :
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              disabled={isDeleting}
              className="w-full h-11 px-4 rounded-xl bg-surface-card border border-error/15 text-base text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-error mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onClose()
                  setDeleteConfirmText('')
                }}
                disabled={isDeleting}
                className="flex-1 h-11 rounded-xl bg-surface-card text-base text-text-tertiary hover:bg-border-hover transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'SUPPRIMER' || isDeleting}
                className="flex-1 h-11 rounded-xl bg-error text-white text-base font-semibold hover:bg-error-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  'Supprimer définitivement'
                )}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
