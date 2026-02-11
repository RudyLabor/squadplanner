import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './useAuth'
import { showSuccess, showError } from '../lib/toast'
import type { SquadChannel, ChannelType } from '../types/database'

export function useSquadChannels(squadId: string | undefined) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['squad-channels', squadId],
    queryFn: async () => {
      if (!squadId) return []
      const { data, error } = await supabase
        .from('squad_channels')
        .select('*')
        .eq('squad_id', squadId)
        .order('position', { ascending: true })

      if (error) {
        // Table might not exist yet
        console.warn('squad_channels not available:', error.message)
        return []
      }
      return data as SquadChannel[]
    },
    enabled: !!squadId,
    staleTime: 30_000,
  })

  const defaultChannel = channels.find(c => c.is_default) || channels[0] || null

  const createChannelMutation = useMutation({
    mutationFn: async (params: { name: string; description?: string; channelType?: ChannelType }) => {
      if (!squadId || !user?.id) throw new Error('Non connecté')
      const { data, error } = await supabase
        .from('squad_channels')
        .insert({
          squad_id: squadId,
          name: params.name,
          description: params.description || null,
          channel_type: params.channelType || 'text',
          created_by: user.id,
          position: channels.length,
        })
        .select()
        .single()

      if (error) throw error
      return data as SquadChannel
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squad-channels', squadId] })
      showSuccess('Canal créé')
    },
    onError: (err: Error) => {
      showError(err.message.includes('duplicate') ? 'Ce nom de canal existe déjà' : 'Erreur lors de la création')
    },
  })

  const updateChannelMutation = useMutation({
    mutationFn: async (params: { channelId: string; name?: string; description?: string }) => {
      const { error } = await supabase
        .from('squad_channels')
        .update({ name: params.name, description: params.description })
        .eq('id', params.channelId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squad-channels', squadId] })
      showSuccess('Canal modifié')
    },
    onError: () => showError('Erreur lors de la modification'),
  })

  const deleteChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const channel = channels.find(c => c.id === channelId)
      if (channel?.is_default) throw new Error('Impossible de supprimer le canal par défaut')

      const { error } = await supabase
        .from('squad_channels')
        .delete()
        .eq('id', channelId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squad-channels', squadId] })
      showSuccess('Canal supprimé')
    },
    onError: (err: Error) => showError(err.message),
  })

  const createChannel = useCallback((name: string, description?: string, channelType?: ChannelType) => {
    createChannelMutation.mutate({ name, description, channelType })
  }, [createChannelMutation])

  const updateChannel = useCallback((channelId: string, name?: string, description?: string) => {
    updateChannelMutation.mutate({ channelId, name, description })
  }, [updateChannelMutation])

  const deleteChannel = useCallback((channelId: string) => {
    deleteChannelMutation.mutate(channelId)
  }, [deleteChannelMutation])

  return {
    channels,
    defaultChannel,
    isLoading,
    createChannel,
    updateChannel,
    deleteChannel,
    isCreating: createChannelMutation.isPending,
  }
}
