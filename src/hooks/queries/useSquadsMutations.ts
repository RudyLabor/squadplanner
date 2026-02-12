import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { queryKeys } from '../../lib/queryClient'
import { showSuccess, showError } from '../../lib/toast'
import { sendMemberJoinedMessage, sendMemberLeftMessage } from '../../lib/systemMessages'
import { createOptimisticMutation } from '../../utils/optimisticUpdate'
import type { SquadWithMembers } from './useSquadsQuery'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function useCreateSquadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, game }: { name: string; game: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || 'User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        if (profileError) throw new Error('Impossible de créer le profil')
      }

      const inviteCode = generateInviteCode()

      const { data: squad, error: squadError } = await supabase
        .from('squads')
        .insert({
          name,
          game,
          owner_id: user.id,
          invite_code: inviteCode,
        })
        .select()
        .single()

      if (squadError) throw squadError

      await supabase
        .from('squad_members')
        .insert({
          squad_id: squad.id,
          user_id: user.id,
          role: 'leader' as const,
        })

      return squad
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.squads.all })
      showSuccess('Squad créée avec succès !')
    },
    onError: (error) => {
      showError(error.message || 'Erreur lors de la création')
    },
  })
}

export function useJoinSquadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || 'User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        if (profileError) throw new Error('Impossible de creer le profil')
      }

      const { data: squad, error: findError } = await supabase
        .from('squads')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

      if (findError || !squad) throw new Error('Code d\'invitation invalide')

      const { data: existing } = await supabase
        .from('squad_members')
        .select('id')
        .eq('squad_id', squad.id)
        .eq('user_id', user.id)
        .single()

      if (existing) throw new Error('Tu fais déjà partie de cette squad')

      const { error: joinError } = await supabase
        .from('squad_members')
        .insert({
          squad_id: squad.id,
          user_id: user.id,
          role: 'member' as const,
        })

      if (joinError) throw joinError

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (profile?.username) {
        sendMemberJoinedMessage(squad.id, profile.username).catch(() => {})
      }

      return squad.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.squads.all })
      showSuccess('Tu as rejoint la squad !')
    },
    onError: (error) => {
      showError(error.message || 'Impossible de rejoindre la squad')
    },
  })
}

export function useLeaveSquadMutation() {
  const queryClient = useQueryClient()

  const optimistic = createOptimisticMutation<void, string>(queryClient, {
    queryKeys: [queryKeys.squads.list()],
    updateCache: (qc, squadId) => {
      qc.setQueryData<SquadWithMembers[]>(queryKeys.squads.list(), (old) =>
        old ? old.filter((s) => s.id !== squadId) : []
      )
    },
    errorMessage: 'Impossible de quitter la squad',
    invalidateKeys: [queryKeys.squads.all],
  })

  return useMutation({
    mutationFn: async (squadId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (profile?.username) {
        await sendMemberLeftMessage(squadId, profile.username)
      }

      const { error } = await supabase
        .from('squad_members')
        .delete()
        .eq('squad_id', squadId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onMutate: optimistic.onMutate,
    onError: optimistic.onError,
    onSuccess: () => {
      showSuccess('Tu as quitte la squad')
    },
    onSettled: optimistic.onSettled,
  })
}

export function useUpdateSquadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ squadId, name, game, description }: { squadId: string; name: string; game: string; description?: string }) => {
      const updates: Record<string, string> = { name, game }
      if (description !== undefined) updates.description = description
      const { error } = await supabase
        .from('squads')
        .update(updates)
        .eq('id', squadId)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.squads.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.squads.detail(variables.squadId) })
      showSuccess('Squad modifiée !')
    },
    onError: (error) => {
      showError(error.message || 'Erreur lors de la modification')
    },
  })
}

export function useDeleteSquadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (squadId: string) => {
      const { error } = await supabase
        .from('squads')
        .delete()
        .eq('id', squadId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.squads.all })
      showSuccess('Squad supprimée')
    },
    onError: (error) => {
      showError(error.message || 'Impossible de supprimer la squad')
    },
  })
}
