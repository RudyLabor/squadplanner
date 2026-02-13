import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { useAuthStore } from './useAuth'
import { showSuccess, showError } from '../lib/toast'
import type { FeedStory, StoryContentType } from '../types/database'

interface CreateStoryParams {
  contentType: StoryContentType
  content: string
  mediaUrl?: string
  squadId?: string
  backgroundColor?: string
  textColor?: string
  metadata?: Record<string, unknown>
}

export function useStories() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Fetch feed stories (from squad members / friends)
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      // Try RPC first
      const { data, error } = await supabase.rpc('get_feed_stories', {
        p_user_id: user.id,
        p_limit: 50,
      })

      if (!error && data) return data as FeedStory[]

      // Fallback to direct query
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('stories')
        .select('*, profiles!user_id(username, avatar_url)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(50)

      if (fallbackError) {
        console.warn('stories table not available:', fallbackError.message)
        return []
      }

      return (fallbackData || []).map((s: Record<string, unknown>) => ({
        story_id: s.id as string,
        user_id: s.user_id as string,
        username: ((s.profiles as Record<string, unknown>)?.username as string) || 'Utilisateur',
        avatar_url: (s.profiles as Record<string, unknown>)?.avatar_url as string | null,
        content_type: s.content_type as StoryContentType,
        content: s.content as string,
        media_url: s.media_url as string | null,
        background_color: (s.background_color as string) || '#5e6dd2',
        text_color: (s.text_color as string) || '#ffffff',
        metadata: (s.metadata as Record<string, unknown>) || {},
        view_count: (s.view_count as number) || 0,
        has_viewed: false,
        created_at: s.created_at as string,
        expires_at: s.expires_at as string,
        story_count: 1,
      })) as FeedStory[]
    },
    enabled: !!user?.id,
    staleTime: 30_000,
    refetchInterval: 60_000, // Refresh every minute for expiry
  })

  // Group stories by user
  const storiesByUser = stories.reduce<Map<string, FeedStory[]>>((acc, story) => {
    const existing = acc.get(story.user_id) || []
    existing.push(story)
    acc.set(story.user_id, existing)
    return acc
  }, new Map())

  // Users with stories (ordered: current user first, then unviewed, then viewed)
  const storyUsers = Array.from(storiesByUser.entries())
    .map(([userId, userStories]) => ({
      userId,
      username: userStories[0].username,
      avatarUrl: userStories[0].avatar_url,
      storyCount: userStories.length,
      hasUnviewed: userStories.some((s) => !s.has_viewed),
      isOwnStory: userId === user?.id,
    }))
    .sort((a, b) => {
      if (a.isOwnStory) return -1
      if (b.isOwnStory) return 1
      if (a.hasUnviewed && !b.hasUnviewed) return -1
      if (!a.hasUnviewed && b.hasUnviewed) return 1
      return 0
    })

  // Create story
  const createStoryMutation = useMutation({
    mutationFn: async (params: CreateStoryParams) => {
      if (!user?.id) throw new Error('Non connecté')

      const { data, error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          squad_id: params.squadId || null,
          content_type: params.contentType,
          content: params.content,
          media_url: params.mediaUrl || null,
          background_color: params.backgroundColor || '#5e6dd2',
          text_color: params.textColor || '#ffffff',
          metadata: params.metadata || {},
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] })
      showSuccess('Story publiée !')
    },
    onError: () => showError('Erreur lors de la publication'),
  })

  // Mark story as viewed
  const viewStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      if (!user?.id) return

      const { error } = await supabase
        .from('story_views')
        .insert({ story_id: storyId, viewer_id: user.id })
        .select()

      // Ignore duplicate errors (already viewed)
      if (error && !error.message.includes('duplicate')) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] })
    },
  })

  // Delete story
  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await supabase.from('stories').delete().eq('id', storyId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] })
      showSuccess('Story supprimée')
    },
    onError: () => showError('Erreur lors de la suppression'),
  })

  const createStory = useCallback(
    (params: CreateStoryParams) => {
      createStoryMutation.mutate(params)
    },
    [createStoryMutation]
  )

  const viewStory = useCallback(
    (storyId: string) => {
      viewStoryMutation.mutate(storyId)
    },
    [viewStoryMutation]
  )

  const deleteStory = useCallback(
    (storyId: string) => {
      deleteStoryMutation.mutate(storyId)
    },
    [deleteStoryMutation]
  )

  const getUserStories = useCallback(
    (userId: string) => {
      return storiesByUser.get(userId) || []
    },
    [storiesByUser]
  )

  return {
    stories,
    storyUsers,
    isLoading,
    createStory,
    viewStory,
    deleteStory,
    getUserStories,
    isCreating: createStoryMutation.isPending,
  }
}

// Story background presets
export const STORY_BACKGROUNDS = [
  { color: '#5e6dd2', label: 'Violet' },
  { color: '#ef4444', label: 'Rouge' },
  { color: '#f59e0b', label: 'Orange' },
  { color: '#10b981', label: 'Vert' },
  { color: '#3b82f6', label: 'Bleu' },
  { color: '#8b5cf6', label: 'Pourpre' },
  { color: '#ec4899', label: 'Rose' },
  { color: '#1a1a2e', label: 'Sombre' },
] as const
