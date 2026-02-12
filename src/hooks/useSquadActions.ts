import { supabase } from '../lib/supabase'
import type { Squad } from '../types/database'
import { sendMemberJoinedMessage, sendMemberLeftMessage } from '../lib/systemMessages'
import { trackChallengeProgress } from '../lib/challengeTracker'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function ensureProfileExists(userId: string, email?: string) {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()
  if (!existingProfile) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      username: email?.split('@')[0] || 'User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    if (profileError) {
      console.warn('[Squads] Profile creation error:', profileError)
      throw new Error('Impossible de creer le profil. Veuillez reessayer.')
    }
  }
}

export async function createSquadAction({
  name,
  game,
}: {
  name: string
  game: string
}): Promise<{ squad: Squad | null; error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    await ensureProfileExists(user.id, user.email)

    const inviteCode = generateInviteCode()
    const { data: squad, error: squadError } = await supabase
      .from('squads')
      .insert({ name, game, owner_id: user.id, invite_code: inviteCode })
      .select()
      .single()
    if (squadError) throw squadError

    const { error: memberError } = await supabase
      .from('squad_members')
      .insert({ squad_id: squad.id, user_id: user.id, role: 'leader' as const })
    if (memberError) throw memberError

    return { squad, error: null }
  } catch (error) {
    return { squad: null, error: error as Error }
  }
}

export async function joinSquadAction(inviteCode: string): Promise<{ error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    await ensureProfileExists(user.id, user.email)

    const { data: squad, error: findError } = await supabase
      .from('squads')
      .select('id')
      .eq('invite_code', inviteCode.toUpperCase())
      .single()
    if (findError || !squad) throw new Error("Code d'invitation invalide")

    const { data: existing } = await supabase
      .from('squad_members')
      .select('id')
      .eq('squad_id', squad.id)
      .eq('user_id', user.id)
      .single()
    if (existing) throw new Error('Tu fais déjà partie de cette squad')

    const { error: joinError } = await supabase
      .from('squad_members')
      .insert({ squad_id: squad.id, user_id: user.id, role: 'member' as const })
    if (joinError) throw joinError

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
    if (profile?.username) {
      sendMemberJoinedMessage(squad.id, profile.username).catch(() => {})
    }

    // Track "invite" challenge for the squad owner (someone joined their squad)
    const { data: squadData } = await supabase
      .from('squads')
      .select('owner_id')
      .eq('id', squad.id)
      .single()
    if (squadData?.owner_id) {
      trackChallengeProgress(squadData.owner_id, 'invite').catch(() => {})
    }

    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function leaveSquadAction(squadId: string): Promise<{ error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
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

    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}
