"use client";

import { useState } from 'react'
import { m } from 'framer-motion'
import {
  Copy,
  Check,
  X,
  Search,
  Share2,
  UserPlus,
  Loader2,
  Users,
} from '../icons'
import { Button, Input } from '../ui'
import { supabase } from '../../lib/supabase'
import { sendMemberJoinedMessage } from '../../lib/systemMessages'
import { showSuccess } from '../../lib/toast'

export function InviteModal({
  isOpen,
  onClose,
  squadId,
  squadName,
  inviteCode,
  existingMemberIds
}: {
  isOpen: boolean
  onClose: () => void
  squadId: string
  squadName: string
  inviteCode: string
  existingMemberIds: string[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ id: string; username: string; avatar_url: string | null }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set())
  const [invitingUser, setInvitingUser] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSearch = async () => {
    if (searchQuery.length < 2) return
    setIsSearching(true)
    setSearchResults([])
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${searchQuery}%`)
        .limit(10)

      if (error) {
        console.error('Erreur recherche:', error)
      } else if (data) {
        const filtered = data.filter(u => !existingMemberIds.includes(u.id))
        setSearchResults(filtered)
      }
    } catch (err) {
      console.error('Erreur recherche:', err)
    }
    setIsSearching(false)
  }

  const handleInvite = async (userId: string, username: string) => {
    setInvitingUser(userId)
    setInviteError(null)
    try {
      const { error } = await supabase
        .from('squad_members')
        .insert({ squad_id: squadId, user_id: userId, role: 'member' })

      if (!error) {
        setInvitedUsers(prev => new Set([...prev, userId]))
        await sendMemberJoinedMessage(squadId, username)
      } else {
        if (error.code === '42501') {
          setInviteError('Tu dois être propriétaire de la squad pour inviter')
        } else if (error.code === '23505') {
          setInviteError('Ce joueur est déjà membre de la squad')
        } else {
          setInviteError(error.message || 'Erreur lors de l\'invitation')
        }
      }
    } catch {
      setInviteError('Erreur réseau, réessaie')
    } finally {
      setInvitingUser(null)
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: `Rejoins ${squadName} sur Squad Planner !`,
      text: `Utilise le code ${inviteCode} pour rejoindre ma squad "${squadName}" !`,
      url: window.location.origin
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(`Rejoins ma squad "${squadName}" sur Squad Planner ! Code: ${inviteCode}`)
      setCopied(true)
      showSuccess('Lien d\'invitation copié !')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    showSuccess('Code d\'invitation copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-overlay backdrop-blur-sm"
      onClick={onClose}
    >
      <m.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-bg-elevated rounded-2xl border border-border-default overflow-hidden shadow-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <h2 className="text-lg font-semibold text-text-primary">Inviter des joueurs</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-1 rounded-lg hover:bg-bg-hover">
            <X className="w-5 h-5 text-text-tertiary" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Code d'invitation */}
          <div className="p-4 rounded-xl bg-primary-10 border border-primary/20">
            <p className="text-sm text-text-tertiary mb-2">Code d'invitation</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary tracking-wider flex-1">
                {inviteCode}
              </span>
              <Button size="sm" variant="secondary" onClick={handleCopyCode} aria-label="Copier le code d'invitation">
                {copied ? <Check className="w-4 h-4 text-success" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
              </Button>
              <Button size="sm" variant="primary" onClick={handleShare} aria-label="Partager le code d'invitation">
                <Share2 className="w-4 h-4" aria-hidden="true" />
                Partager
              </Button>
            </div>
          </div>

          {/* Recherche d'utilisateurs */}
          <div>
            <p className="text-sm text-text-tertiary mb-2">Ou rechercher un joueur</p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-quaternary" />
                <Input
                  placeholder="Nom d'utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching || searchQuery.length < 2}>
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Chercher'}
              </Button>
            </div>
          </div>

          {/* Message d'erreur */}
          {inviteError && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20">
              <p className="text-error text-base">{inviteError}</p>
            </div>
          )}

          {/* Resultats de recherche */}
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-card">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <span className="flex-1 text-md text-text-primary">{user.username}</span>
                  {invitedUsers.has(user.id) ? (
                    <span className="text-sm text-success flex items-center gap-1">
                      <Check className="w-4 h-4" /> Ajoute
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleInvite(user.id, user.username)}
                      disabled={invitingUser === user.id}
                    >
                      {invitingUser === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      {invitingUser === user.id ? 'Ajout...' : 'Inviter'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
            <p className="text-center text-base text-text-quaternary py-4">
              Aucun joueur trouve
            </p>
          )}
        </div>
      </m.div>
    </m.div>
  )
}
