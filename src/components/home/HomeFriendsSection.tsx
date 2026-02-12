import { memo } from 'react'
import { SkeletonFriendsPlaying } from '../ui'
import { FriendsPlaying, type FriendPlaying } from '../FriendsPlaying'

interface HomeFriendsSectionProps {
  friendsPlaying: FriendPlaying[]
  friendsLoading: boolean
  onJoin: (squadId: string) => void
  onInvite: (friendId: string) => void
}

export const HomeFriendsSection = memo(function HomeFriendsSection({
  friendsPlaying,
  friendsLoading,
  onJoin,
  onInvite,
}: HomeFriendsSectionProps) {
  if (friendsLoading) {
    return <SkeletonFriendsPlaying />
  }

  return <FriendsPlaying friends={friendsPlaying} onJoin={onJoin} onInvite={onInvite} />
})
