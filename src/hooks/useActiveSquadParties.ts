import { useEffect, useState, useCallback } from 'react'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface ActivePartyMember {
  id: string
  username: string
  avatar_url: string | null
  voice_channel_id: string
}

export interface SquadActiveParty {
  squadId: string
  channelId: string
  members: ActivePartyMember[]
}

/**
 * Subscribes to active voice parties for a list of squad IDs.
 * Returns a map of squadId → active party members (via profiles.voice_channel_id).
 * Uses Supabase Realtime to stay in sync.
 */
export function useActiveSquadParties(squadIds: string[]) {
  const [parties, setParties] = useState<Map<string, SquadActiveParty>>(new Map())
  const [loading, setLoading] = useState(false)

  const fetchParties = useCallback(async () => {
    if (squadIds.length === 0) return
    setLoading(true)
    try {
      // For each squad, find members who have voice_channel_id matching "squad-{id}"
      const channelIds = squadIds.map((id) => `squad-${id}`)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, voice_channel_id')
        .in('voice_channel_id', channelIds)

      if (error) {
        console.warn('[ActiveParties] Error fetching:', error)
        return
      }

      const newParties = new Map<string, SquadActiveParty>()
      for (const profile of data || []) {
        if (!profile.voice_channel_id) continue
        const squadId = profile.voice_channel_id.replace('squad-', '')
        const existing = newParties.get(squadId)
        const member: ActivePartyMember = {
          id: profile.id,
          username: profile.username || 'Joueur',
          avatar_url: profile.avatar_url,
          voice_channel_id: profile.voice_channel_id,
        }
        if (existing) {
          existing.members.push(member)
        } else {
          newParties.set(squadId, {
            squadId,
            channelId: profile.voice_channel_id,
            members: [member],
          })
        }
      }
      setParties(newParties)
    } catch (err) {
      console.warn('[ActiveParties] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [squadIds.join(',')])

  useEffect(() => {
    fetchParties()

    // Subscribe to realtime changes on profiles.voice_channel_id
    let channel: RealtimeChannel | null = null
    if (squadIds.length > 0) {
      channel = supabase
        .channel('active-parties')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
          },
          (payload) => {
            const newRow = payload.new as { voice_channel_id?: string | null }
            const oldRow = payload.old as { voice_channel_id?: string | null }
            // Only re-fetch if voice_channel_id changed
            if (newRow.voice_channel_id !== oldRow.voice_channel_id) {
              fetchParties()
            }
          }
        )
        .subscribe()
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [fetchParties, squadIds.length])

  return { parties, loading, refetch: fetchParties }
}
