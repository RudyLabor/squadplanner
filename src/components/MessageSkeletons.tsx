"use client";

import { memo } from 'react'
import { Skeleton, SkeletonAvatar } from './ui/Skeleton'

export const MessageSkeleton = memo(({ isOwn, showAvatar }: { isOwn: boolean; showAvatar: boolean }) => (
  <div
    className={`flex gap-2 py-1 ${isOwn ? 'flex-row-reverse' : ''}`}
    aria-hidden="true"
  >
    {!isOwn && (
      <div className={showAvatar ? 'visible' : 'invisible'}>
        <SkeletonAvatar size="sm" />
      </div>
    )}
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      {!isOwn && showAvatar && (
        <Skeleton className="h-3 w-16 mb-1" rounded="sm" />
      )}
      <Skeleton
        className={`h-12 ${isOwn ? 'w-36' : 'w-44'}`}
        rounded="xl"
      />
      <Skeleton className="h-2 w-10 mt-1" rounded="sm" />
    </div>
  </div>
))
MessageSkeleton.displayName = 'MessageSkeleton'

export function MessageListSkeleton({ count = 8 }: { count?: number }) {
  const skeletons = Array.from({ length: count }, (_, i) => ({
    isOwn: i % 3 === 1,
    showAvatar: i === 0 || (i % 3 !== 1 && (i - 1) % 3 === 1),
  }))

  return (
    <div className="space-y-3 p-4" aria-label="Chargement des messages...">
      {skeletons.map((props, i) => (
        <MessageSkeleton key={i} {...props} />
      ))}
    </div>
  )
}

export const ConversationSkeleton = memo(function ConversationSkeleton() {
  return (
    <div className="p-3 rounded-xl" aria-hidden="true">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Skeleton className="w-12 h-12" rounded="xl" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-4 w-24" rounded="sm" />
            <Skeleton className="h-3 w-10" rounded="sm" />
          </div>
          <Skeleton className="h-3 w-40" rounded="sm" />
        </div>
      </div>
    </div>
  )
})

export const DMConversationSkeleton = memo(function DMConversationSkeleton() {
  return (
    <div className="p-3 rounded-xl" aria-hidden="true">
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-4 w-20" rounded="sm" />
            <Skeleton className="h-3 w-10" rounded="sm" />
          </div>
          <Skeleton className="h-3 w-36" rounded="sm" />
        </div>
      </div>
    </div>
  )
})

export function ConversationListSkeleton({ count = 5, type = 'squad' }: { count?: number; type?: 'squad' | 'dm' }) {
  const SkeletonComponent = type === 'dm' ? DMConversationSkeleton : ConversationSkeleton

  return (
    <div className="space-y-1" aria-label="Chargement des conversations...">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  )
}
