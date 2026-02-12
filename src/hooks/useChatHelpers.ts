import { supabase } from '../lib/supabase'

export const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || ''
export const MAX_RECONNECT_ATTEMPTS = 3
export const PARTY_STORAGE_KEY = 'squadplanner_active_party'

export interface VoiceChatUser {
  odrop: string
  username: string
  isMuted: boolean
  isSpeaking: boolean
  volume: number
}

export function savePartyToStorage(channelName: string, userId: string, username: string) {
  try {
    localStorage.setItem(
      PARTY_STORAGE_KEY,
      JSON.stringify({
        channelName,
        userId,
        username,
        timestamp: Date.now(),
      })
    )
  } catch (e) {
    console.warn('[VoiceChat] Could not save party to storage:', e)
  }
}

export function getSavedPartyInfo(): {
  channelName: string
  userId: string
  username: string
} | null {
  try {
    const data = localStorage.getItem(PARTY_STORAGE_KEY)
    if (!data) return null
    const parsed = JSON.parse(data)
    if (Date.now() - parsed.timestamp > 5 * 60 * 1000) {
      localStorage.removeItem(PARTY_STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearSavedParty() {
  try {
    localStorage.removeItem(PARTY_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

async function cleanupVoicePartyInDb() {
  try {
    await supabase.rpc('leave_voice_party')
  } catch {
    /* ignore */
  }
}

export async function forceLeaveVoiceParty(
  storeGetter: () => { isConnected: boolean; leaveChannel: () => Promise<void> }
) {
  const state = storeGetter()
  if (state.isConnected) {
    await state.leaveChannel()
  } else {
    await cleanupVoicePartyInDb()
  }
  clearSavedParty()
}

let cleanupListenersInitialized = false

export function setupBrowserCloseListeners(
  storeGetter: () => { isConnected: boolean; room: { disconnect: () => void } | null }
) {
  if (cleanupListenersInitialized || typeof window === 'undefined') return
  cleanupListenersInitialized = true

  const handleBeforeUnload = () => {
    const state = storeGetter()
    if (state.isConnected) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        const url = `${supabaseUrl}/rest/v1/rpc/leave_voice_party`
        const sessionData = localStorage.getItem('sb-nxbqiwmfyafgshxzczxo-auth-token')
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData)
            const accessToken = session?.access_token
            fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: supabaseKey,
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({}),
              keepalive: true,
            }).catch(() => {})
          } catch {
            /* ignore */
          }
        }
      }

      if (state.room) {
        state.room.disconnect()
      }
      clearSavedParty()
    }
  }

  window.addEventListener('pagehide', handleBeforeUnload)
  window.addEventListener('beforeunload', handleBeforeUnload)
}
