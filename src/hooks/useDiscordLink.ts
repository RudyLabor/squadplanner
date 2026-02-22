import { useState, useCallback } from 'react'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { showSuccess, showError } from '../lib/toast'
import { useAuthStore } from './useAuth'

const DISCORD_CLIENT_ID = '1466209230909476918'
const DISCORD_REDIRECT_URI =
  typeof window !== 'undefined'
    ? `${window.location.origin}/auth/discord/callback`
    : 'https://squadplanner.fr/auth/discord/callback'

export function useDiscordLink() {
  const [isLinking, setIsLinking] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)

  const linkDiscord = useCallback(() => {
    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: DISCORD_REDIRECT_URI,
      response_type: 'code',
      scope: 'identify',
    })
    window.location.href = `https://discord.com/oauth2/authorize?${params.toString()}`
  }, [])

  const unlinkDiscord = useCallback(async () => {
    setIsUnlinking(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Non connecte')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discord-oauth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ action: 'unlink' }),
        }
      )

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur inconnue')

      // Update local profile state
      const profile = useAuthStore.getState().profile
      if (profile) {
        useAuthStore.setState({
          profile: { ...profile, discord_user_id: null, discord_username: null },
        })
      }

      showSuccess('Discord deconnecte')
    } catch (err) {
      showError((err as Error).message)
    } finally {
      setIsUnlinking(false)
    }
  }, [])

  return { linkDiscord, unlinkDiscord, isLinking, isUnlinking, setIsLinking }
}
