import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Loader2 } from '../../components/icons'
import { supabase } from '../../lib/supabase'
import { showError } from '../../lib/toast'

interface SettingsDeleteModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDeleteModal({ isOpen, onClose }: SettingsDeleteModalProps) {
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') return
    setIsDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
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
      localStorage.clear(); sessionStorage.clear()
      window.location.href = '/'
    } catch {
      showError('Erreur lors de la suppression. Contacte le support.')
      setIsDeleting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-overlay backdrop-blur-sm"
          onClick={() => !isDeleting && onClose()}>
          <m.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-bg-elevated rounded-2xl border border-error/10 p-6 shadow-modal">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-error-10 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-error" /></div>
              <h3 className="text-lg font-bold text-text-primary">Supprimer ton compte</h3>
            </div>
            <p className="text-md text-text-tertiary mb-4">
              Cette action est <span className="text-error font-semibold">d&eacute;finitive et irr&eacute;versible</span>.
              Toutes tes donn&eacute;es seront supprim&eacute;es : profil, messages, squads, statistiques.
            </p>
            <p className="text-base text-text-tertiary mb-3">
              Tape <span className="font-mono text-error font-bold">SUPPRIMER</span> pour confirmer :
            </p>
            <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="SUPPRIMER" disabled={isDeleting}
              className="w-full h-11 px-4 rounded-xl bg-surface-card border border-error/15 text-md text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-error mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { onClose(); setDeleteConfirmText('') }} disabled={isDeleting}
                className="flex-1 h-11 rounded-xl bg-surface-card text-md text-text-tertiary hover:bg-border-hover transition-colors disabled:opacity-50">Annuler</button>
              <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'SUPPRIMER' || isDeleting}
                className="flex-1 h-11 rounded-xl bg-error text-white text-md font-semibold hover:bg-error-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin" />Suppression...</> : 'Supprimer d\u00e9finitivement'}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
