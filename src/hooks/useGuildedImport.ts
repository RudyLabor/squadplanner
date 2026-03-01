import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { queryKeys } from '../lib/queryClient'
import { showSuccess, showError } from '../lib/toast'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GuildedImportData {
  serverName: string
  game: string
  description?: string
  /** One username per line (optional) */
  memberNames?: string
}

export interface GuildedImportResult {
  squadId: string
  squadName: string
  inviteCode: string
  memberCount: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/** Parse member names from textarea (one per line), filter blanks */
function parseMemberNames(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useGuildedImport — Import a Guilded server as a Squad.
 *
 * This is a MANUAL import: the user types their server info into a form
 * and a new Squad is created with the same name. The Guilded API integration
 * can come later.
 *
 * Creates a new squad with:
 * - Server name as squad name
 * - Selected game
 * - Generated invite code
 * - Optional description
 *
 * Returns the created squad info including the invite code for sharing.
 */
export function useGuildedImport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: GuildedImportData): Promise<GuildedImportResult> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Ensure profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: user.id,
          username: user.email?.split('@')[0] || 'User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        if (profileError) throw new Error('Impossible de créer le profil')
      }

      const inviteCode = generateInviteCode()

      // Create the squad
      const insertData: Record<string, string> = {
        name: data.serverName,
        game: data.game,
        owner_id: user.id,
        invite_code: inviteCode,
      }
      if (data.description) {
        insertData.description = data.description
      }

      const { data: squad, error: squadError } = await supabase
        .from('squads')
        .insert(insertData)
        .select()
        .single()

      if (squadError) throw squadError

      // Add the creator as leader
      await supabase.from('squad_members').insert({
        squad_id: squad.id,
        user_id: user.id,
        role: 'leader' as const,
      })

      // Count members for the result (just the creator for now)
      const memberNames = data.memberNames ? parseMemberNames(data.memberNames) : []
      const memberCount = 1 + memberNames.length // creator + listed members (listed are pending invites)

      return {
        squadId: squad.id,
        squadName: squad.name,
        inviteCode: squad.invite_code,
        memberCount,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.squads.all })
      showSuccess('Squad créée avec succès ! Partage le code avec tes membres Guilded.')
      // Gamification
      import('../stores/useGamificationStore').then(({ useGamificationStore }) => {
        const store = useGamificationStore.getState()
        store.addXP('squad.create')
        store.incrementStat('squadsCreated')
      })
    },
    onError: (error) => {
      showError(error.message || "Erreur lors de l'import")
    },
  })
}
