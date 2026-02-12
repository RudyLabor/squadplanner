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

  const shareUrl = `${window.location.origin}/join/${inviteCode}`

  const handleShare = async () => {
    const shareData = {
      title: `Rejoins ${squadName} sur Squad Planner !`,
      text: `Rejoins ma squad \u00AB\u202F${squadName}\u202F\u00BB sur Squad Planner !`,
      url: shareUrl
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
          {/* Code d'invitation + lien direct */}
          <div className="p-4 rounded-xl bg-primary-10 border border-primary/20 space-y-3">
            <div>
              <p className="text-sm text-text-tertiary mb-2">Code d'invitation</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-primary tracking-wider flex-1">
                  {inviteCode}
                </span>
                <Button size="sm" variant="secondary" onClick={handleCopyCode} aria-label="Copier le code d'invitation">
                  {copied ? <Check className="w-4 h-4 text-success" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                </Button>
              </div>
            </div>
            {/* Lien direct partageable */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-bg-base border border-border-subtle">
              <span className="flex-1 text-sm text-text-tertiary truncate">{shareUrl}</span>
              <Button size="sm" variant="secondary" onClick={async () => {
                await navigator.clipboard.writeText(shareUrl)
                setCopied(true)
                showSuccess('Lien copié !')
                setTimeout(() => setCopied(false), 2000)
              }} aria-label="Copier le lien">
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            {/* UX #6: Partage multicanal — WhatsApp, SMS, Discord, Natif */}
            <div className="grid grid-cols-4 gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Rejoins ma squad « ${squadName} » sur Squad Planner ! ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors"
              >
                <svg className="w-6 h-6 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span className="text-xs text-text-secondary">WhatsApp</span>
              </a>
              <a
                href={`sms:?body=${encodeURIComponent(`Rejoins ma squad "${squadName}" sur Squad Planner ! ${shareUrl}`)}`}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-info/10 hover:bg-info/20 transition-colors"
              >
                <svg className="w-6 h-6 text-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span className="text-xs text-text-secondary">SMS</span>
              </a>
              <a
                href={`https://discord.com/channels/@me`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={async (e) => {
                  e.preventDefault()
                  await navigator.clipboard.writeText(`Rejoins ma squad "${squadName}" sur Squad Planner ! ${shareUrl}`)
                  showSuccess('Lien copié ! Colle-le dans Discord')
                  window.open('https://discord.com/channels/@me', '_blank')
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#5865F2]/10 hover:bg-[#5865F2]/20 transition-colors"
              >
                <svg className="w-6 h-6 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
                <span className="text-xs text-text-secondary">Discord</span>
              </a>
              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Share2 className="w-6 h-6 text-primary" />
                <span className="text-xs text-text-secondary">Plus</span>
              </button>
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
