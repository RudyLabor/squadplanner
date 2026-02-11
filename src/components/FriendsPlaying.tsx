import { memo } from 'react'
import { m } from 'framer-motion'
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
const FriendCard = memo(function FriendCard({
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
    <m.div
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="p-4 bg-gradient-to-br from-primary-10 via-transparent to-success-5 hover:from-primary-15 hover:to-success-10 hover:shadow-glow-primary-md transition-interactive">
        <div className="flex flex-col gap-3">
          {/* Avatar with pulse animation */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {friend.avatar_url ? (
                <img
                  src={getOptimizedAvatarUrl(friend.avatar_url, 48) || friend.avatar_url}
                  alt={friend.username}
                  className="w-12 h-12 rounded-full object-cover border-2 border-success/30"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary-hover/20 flex items-center justify-center border-2 border-success/30">
                  <span className="text-lg font-semibold text-text-primary">
                    {friend.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {/* Live pulse indicator */}
              <m.div
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-success border-2 border-bg-base"
                animate={{
                  scale: [1, 1.2, 1],
                  boxShadow: [
                    '0 0 0 0 var(--color-success-20)',
                    '0 0 0 6px transparent',
                    '0 0 0 0 transparent'
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
              <div className="text-md font-semibold text-text-primary truncate">
                {friend.username}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                {friend.is_in_voice ? (
                  <>
                    <Users className="w-3.5 h-3.5 text-success" />
                    <span className="truncate text-success">En Party vocale</span>
                  </>
                ) : friend.current_game ? (
                  <>
                    <Gamepad2 className="w-3.5 h-3.5 text-primary" />
                    <span className="truncate">{friend.current_game}</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span className="truncate">En ligne</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Squad info */}
          {isInParty && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-card border border-border-subtle">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm text-text-secondary truncate">
                {friend.squad_name}
              </span>
              <span className="text-sm text-text-tertiary ml-auto">
                {friend.party_member_count} {friend.party_member_count > 1 ? 'joueurs' : 'joueur'}
              </span>
            </div>
          )}

          {/* Action button */}
          {isInParty ? (
            <m.button
              onClick={() => onJoin(friend.squad_id)}
              whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-glow-success)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 h-10 min-h-[44px] rounded-lg bg-success/15 hover:bg-success/25 border border-success/30 text-success text-base font-medium transition-interactive"
            >
              <LogIn className="w-4 h-4" />
              Rejoindre
            </m.button>
          ) : (
            <m.button
              onClick={() => onInvite(friend.friend_id)}
              whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-glow-primary-md)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 h-10 min-h-[44px] rounded-lg bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary text-base font-medium transition-interactive"
            >
              <UserPlus className="w-4 h-4" />
              Inviter
            </m.button>
          )}
        </div>
      </Card>
    </m.div>
  )
})

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
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="p-5 bg-gradient-to-br from-primary/5 to-success/5 border-dashed">
        <div className="flex items-center gap-4">
          <m.div
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-success/10 flex items-center justify-center flex-shrink-0"
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          >
            <UserPlus className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </m.div>
          <div className="flex-1 min-w-0">
            <p className="text-md font-semibold text-text-primary mb-0.5">
              Invite tes potes sur Squad Planner
            </p>
            <p className="text-sm text-text-tertiary mb-2">
              Partage le lien pour jouer ensemble
            </p>
            <m.button
              onClick={handleShareInvite}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-sm font-medium hover:bg-primary/25 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Envoyer une invitation
            </m.button>
          </div>
        </div>
      </Card>
    </m.div>
  )
}

// Main component
export function FriendsPlaying({ friends, onJoin, onInvite }: FriendsPlayingProps) {
  if (friends.length === 0) {
    return (
      <div className="mb-6">
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
        <m.div
          className="shrink-0"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Gamepad2 className="w-5 h-5 text-success" />
        </m.div>
        En train de jouer
        <span className="ml-auto text-sm font-normal text-primary">
          {friends.length} en ligne
        </span>
      </h2>

      {/* Single render with responsive layout - horizontal scroll on mobile, grid on desktop */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4 scrollbar-hide">
          {friends.map((friend, index) => (
            <m.div
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
            </m.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FriendsPlaying
