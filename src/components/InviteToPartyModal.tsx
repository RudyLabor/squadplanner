import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, Check, Loader2, Send, Copy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from './ui'

interface SquadMember {
  id: string
  username: string
  avatar_url: string | null
  is_online: boolean
  voice_channel_id: string | null
}

interface InviteToPartyModalProps {
  isOpen: boolean
  onClose: () => void
  squadId: string
  squadName: string
  partyLink: string
  currentUserId: string
  connectedUserIds: string[] // Les IDs des utilisateurs déjà dans la party
}

export function InviteToPartyModal({
  isOpen,
  onClose,
  squadId,
  squadName,
  partyLink,
  currentUserId,
  connectedUserIds
}: InviteToPartyModalProps) {
  const [members, setMembers] = useState<SquadMember[]>([])
  const [loading, setLoading] = useState(true)
  const [linkCopied, setLinkCopied] = useState(false)
  const [invitedMembers, setInvitedMembers] = useState<Set<string>>(new Set())
  const [sendingInvite, setSendingInvite] = useState<string | null>(null)

  // Fetch squad members
  useEffect(() => {
    if (!isOpen) return

    const fetchMembers = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('squad_members')
          .select(`
            user_id,
            profiles!inner(
              id,
              username,
              avatar_url,
              last_seen_at,
              voice_channel_id
            )
          `)
          .eq('squad_id', squadId)

        if (error) throw error

        const squadMembers: SquadMember[] = (data || [])
          .map((m: any) => ({
            id: m.profiles.id,
            username: m.profiles.username || 'Joueur',
            avatar_url: m.profiles.avatar_url,
            is_online: m.profiles.last_seen_at
              ? new Date(m.profiles.last_seen_at) > new Date(Date.now() - 15 * 60 * 1000)
              : false,
            voice_channel_id: m.profiles.voice_channel_id
          }))
          // Exclude current user and users already in party
          .filter((m: SquadMember) =>
            m.id !== currentUserId && !connectedUserIds.includes(m.id)
          )

        setMembers(squadMembers)
      } catch (error) {
        console.error('Error fetching squad members:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [isOpen, squadId, currentUserId, connectedUserIds])

  const copyLink = () => {
    navigator.clipboard.writeText(partyLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const inviteMember = async (memberId: string) => {
    setSendingInvite(memberId)
    try {
      // Create a notification for the member (in-app)
      await supabase.from('notifications').insert({
        user_id: memberId,
        type: 'party_invite',
        title: 'Invitation à une Party',
        message: `Tu es invité à rejoindre la party de ${squadName}`,
        data: {
          squad_id: squadId,
          party_link: partyLink,
          invited_by: currentUserId
        }
      })

      // Send push notification (native + web) pour sonnerie/vibration
      try {
        await supabase.functions.invoke('send-push', {
          body: {
            userId: memberId,
            title: 'Invitation Party',
            body: `Tu es invité à rejoindre la party de ${squadName}`,
            icon: '/icon-192.png',
            tag: `party-invite-${squadId}`,
            url: partyLink,
            data: {
              type: 'party_invite',
              squad_id: squadId,
              party_link: partyLink,
              invited_by: currentUserId
            }
          }
        })
        console.log('[InviteToPartyModal] Push notification sent')
      } catch (pushError) {
        console.warn('[InviteToPartyModal] Push notification failed:', pushError)
        // Continue même si push échoue
      }

      setInvitedMembers(prev => new Set([...prev, memberId]))
    } catch (error) {
      console.error('Error sending invite:', error)
      // Even if notification fails, mark as invited (link still works)
      setInvitedMembers(prev => new Set([...prev, memberId]))
    } finally {
      setSendingInvite(null)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-party-title"
          className="w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-2xl overflow-hidden shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6366f1]/15 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-[#6366f1]" />
              </div>
              <div>
                <h2 id="invite-party-title" className="text-[16px] font-semibold text-[#f7f8f8]">Inviter à la Party</h2>
                <p className="text-[12px] text-[#8b8d90]">{squadName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5 text-[#8b8d90]" />
            </button>
          </div>

          {/* Copy link section */}
          <div className="p-4 border-b border-white/5">
            <button
              onClick={copyLink}
              className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl transition-interactive ${
                linkCopied
                  ? 'bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/20'
                  : 'bg-white/5 text-[#8b8d90] hover:bg-white/10 hover:text-[#f7f8f8] border border-white/10'
              }`}
            >
              {linkCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  Lien copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier le lien d'invitation
                </>
              )}
            </button>
          </div>

          {/* Members list */}
          <div className="p-4 max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-[#6366f1] animate-spin" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[14px] text-[#8b8d90]">
                  Tous les membres sont déjà dans la party !
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[12px] text-[#5e6063] mb-3 uppercase tracking-wide font-medium">
                  Membres de la squad ({members.length})
                </p>
                {members.map((member) => {
                  const isInvited = invitedMembers.has(member.id)
                  const isSending = sendingInvite === member.id

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                    >
                      {/* Avatar */}
                      <div className="relative">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#6366f1]/20 flex items-center justify-center">
                            <span className="text-[14px] font-semibold text-[#6366f1]">
                              {member.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {/* Online indicator */}
                        {member.is_online && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#34d399] border-2 border-[#0c0c0e]" />
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-[#f7f8f8] truncate">
                          {member.username}
                        </p>
                        <p className="text-[12px] text-[#5e6063]">
                          {member.is_online ? 'En ligne' : 'Hors ligne'}
                        </p>
                      </div>

                      {/* Invite button */}
                      <Button
                        size="sm"
                        variant={isInvited ? 'ghost' : 'primary'}
                        onClick={() => !isInvited && inviteMember(member.id)}
                        disabled={isInvited || isSending}
                        className={isInvited ? 'text-[#34d399] bg-[#34d399]/10' : ''}
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isInvited ? (
                          <>
                            <Check className="w-4 h-4" />
                            Invité
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Inviter
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/5">
            <Button
              variant="ghost"
              className="w-full"
              onClick={onClose}
            >
              Fermer
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default InviteToPartyModal
