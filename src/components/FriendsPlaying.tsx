import { motion } from 'framer-motion'
import { Gamepad2, UserPlus, Users, LogIn } from 'lucide-react'
import { Card } from './ui'
import { showSuccess } from '../lib/toast'
import { getOptimizedAvatarUrl } from '../utils/avatarUrl'

// Types - matches the return type from get_friends_playing RPC
export interface FriendPlaying {
  friend_id: string
  username: string
  avatar_url: string | null
  current_game: string | null
  last_seen_at: string | null
  squad_id: string
  squad_name: string
  party_member_count: number
  voice_channel_id: string | null
  is_in_voice: boolean
}

export interface FriendsPlayingProps {
  friends: FriendPlaying[]
  onJoin: (squadId: string) => void
  onInvite: (friendId: string) => void
}

// Individual friend card
function FriendCard({
  friend,
  onJoin,
  onInvite
}: {
  friend: FriendPlaying
  onJoin: (squadId: string) => void
  onInvite: (friendId: string) => void
}) {
  // Un ami est en party vocale s'il a un channel actif
  const isInParty = friend.is_in_voice || friend.party_member_count > 0

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="p-4 bg-gradient-to-br from-[rgba(94,109,210,0.08)] via-transparent to-[rgba(74,222,128,0.05)] hover:from-[rgba(94,109,210,0.12)] hover:to-[rgba(74,222,128,0.08)] hover:shadow-[0_0_20px_rgba(94,109,210,0.2)] transition-interactive">
        <div className="flex flex-col gap-3">
          {/* Avatar with pulse animation */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {friend.avatar_url ? (
                <img
                  src={getOptimizedAvatarUrl(friend.avatar_url, 48) || friend.avatar_url}
                  alt={friend.username}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#4ade80]/30"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5e6dd2]/30 to-[#8b93ff]/20 flex items-center justify-center border-2 border-[#4ade80]/30">
                  <span className="text-[16px] font-semibold text-[#f7f8f8]">
                    {friend.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {/* Live pulse indicator */}
              <motion.div
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#4ade80] border-2 border-[#08090a]"
                animate={{
                  scale: [1, 1.2, 1],
                  boxShadow: [
                    '0 0 0 0 rgba(74, 222, 128, 0.4)',
                    '0 0 0 6px rgba(74, 222, 128, 0)',
                    '0 0 0 0 rgba(74, 222, 128, 0)'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-[#f7f8f8] truncate">
                {friend.username}
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-[#8b8d90]">
                {friend.is_in_voice ? (
                  <>
                    <Users className="w-3.5 h-3.5 text-[#4ade80]" />
                    <span className="truncate text-[#4ade80]">En Party vocale</span>
                  </>
                ) : friend.current_game ? (
                  <>
                    <Gamepad2 className="w-3.5 h-3.5 text-[#5e6dd2]" />
                    <span className="truncate">{friend.current_game}</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5 text-[#5e6dd2]" />
                    <span className="truncate">En ligne</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Squad info */}
          {isInParty && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/5">
              <Users className="w-3.5 h-3.5 text-[#5e6dd2]" />
              <span className="text-[12px] text-[#8b8d90] truncate">
                {friend.squad_name}
              </span>
              <span className="text-[11px] text-[#5e6063] ml-auto">
                {friend.party_member_count} {friend.party_member_count > 1 ? 'joueurs' : 'joueur'}
              </span>
            </div>
          )}

          {/* Action button */}
          {isInParty ? (
            <motion.button
              onClick={() => onJoin(friend.squad_id)}
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(74, 222, 128, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 h-10 min-h-[44px] rounded-lg bg-[#4ade80]/15 hover:bg-[#4ade80]/25 border border-[#4ade80]/30 text-[#4ade80] text-[13px] font-medium transition-interactive"
            >
              <LogIn className="w-4 h-4" />
              Rejoindre
            </motion.button>
          ) : (
            <motion.button
              onClick={() => onInvite(friend.friend_id)}
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(94, 109, 210, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 h-10 min-h-[44px] rounded-lg bg-[#5e6dd2]/15 hover:bg-[#5e6dd2]/25 border border-[#5e6dd2]/30 text-[#5e6dd2] text-[13px] font-medium transition-interactive"
            >
              <UserPlus className="w-4 h-4" />
              Inviter
            </motion.button>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

// Empty state component with actionable invite button
function EmptyState() {
  const handleShareInvite = async () => {
    const inviteText = "Rejoins-moi sur Squad Planner pour organiser nos sessions de jeu ! 🎮"
    const inviteUrl = window.location.origin

    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Squad Planner',
          text: inviteText,
          url: inviteUrl,
        })
      } catch (err) {
        // User cancelled or error - fallback to clipboard
        copyToClipboard(inviteUrl)
      }
    } else {
      copyToClipboard(inviteUrl)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showSuccess('Code d\'invitation copié ! 📋')
    } catch {
      showSuccess('Lien copié ! 📋')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="p-6 text-center bg-gradient-to-br from-[rgba(94,109,210,0.05)] to-transparent border-dashed">
        <motion.div
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5e6dd2]/15 to-[#8b93ff]/10 flex items-center justify-center mx-auto mb-3"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        >
          <Users className="w-7 h-7 text-[#5e6dd2]" strokeWidth={1.5} />
        </motion.div>
        <p className="text-[14px] text-[#8b8d90] mb-1">
          Aucun pote en ligne pour l'instant
        </p>
        <motion.button
          onClick={handleShareInvite}
          className="text-[13px] text-[#5e6dd2] hover:text-[#8b93ff] font-medium transition-colors cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Invite tes potes à rejoindre Squad Planner ! →
        </motion.button>
      </Card>
    </motion.div>
  )
}

// Main component
export function FriendsPlaying({ friends, onJoin, onInvite }: FriendsPlayingProps) {
  if (friends.length === 0) {
    return (
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold text-[#f7f8f8] mb-3 flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-[#4ade80]" />
          Tes potes jouent maintenant
        </h2>
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h2 className="text-[18px] font-semibold text-[#f7f8f8] mb-3 flex items-center gap-2">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Gamepad2 className="w-4 h-4 text-[#4ade80]" />
        </motion.div>
        Tes potes jouent maintenant
        <span className="ml-auto text-[12px] font-normal text-[#5e6dd2]">
          {friends.length} en ligne
        </span>
      </h2>

      {/* Single render with responsive layout - horizontal scroll on mobile, grid on desktop */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4 scrollbar-hide">
          {friends.map((friend, index) => (
            <motion.div
              key={friend.friend_id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="flex-shrink-0 w-[200px] md:w-auto"
            >
              <FriendCard
                friend={friend}
                onJoin={onJoin}
                onInvite={onInvite}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FriendsPlaying
