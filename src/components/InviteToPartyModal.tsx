import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from './ui'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { CopyLinkButton } from './invite/CopyLinkButton'
import { InviteUserList, type SquadMember } from './invite/InviteUserList'

interface InviteToPartyModalProps {
  isOpen: boolean
  onClose: () => void
  squadId: string
  squadName: string
  partyLink: string
  currentUserId: string
  connectedUserIds: string[]
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
  const focusTrapRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)
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
      } catch (pushError) {
        console.warn('[InviteToPartyModal] Push notification failed:', pushError)
      }

      setInvitedMembers(prev => new Set([...prev, memberId]))
    } catch (error) {
      console.error('Error sending invite:', error)
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
          ref={focusTrapRef}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-party-title"
          className="w-full max-w-md bg-bg-base border border-border-subtle rounded-2xl overflow-hidden shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-15 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 id="invite-party-title" className="text-lg font-semibold text-text-primary">Inviter à la Party</h2>
                <p className="text-sm text-text-secondary">{squadName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="p-2 rounded-lg hover:bg-overlay-subtle transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          <CopyLinkButton linkCopied={linkCopied} onCopy={copyLink} />

          {/* Members list */}
          <div className="p-4 max-h-[300px] overflow-y-auto">
            <InviteUserList
              members={members}
              loading={loading}
              invitedMembers={invitedMembers}
              sendingInvite={sendingInvite}
              onInvite={inviteMember}
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border-subtle">
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
