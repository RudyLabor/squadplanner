import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Loader2 } from '../components/icons'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { showSuccess, showError } from '../lib/toast'
import { useAuthStore } from '../hooks'

export function DiscordCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const code = searchParams.get('code')
    const oauthError = searchParams.get('error')

    if (oauthError) {
      setError('Autorisation Discord refusee')
      setTimeout(() => navigate('/settings', { replace: true }), 2000)
      return
    }

    if (!code) {
      setError('Code OAuth manquant')
      setTimeout(() => navigate('/settings', { replace: true }), 2000)
      return
    }

    async function exchangeCode(code: string) {
      try {
        // Force-refresh the session — the access_token expires during
        // the Discord OAuth redirect round-trip (full page navigation)
        let accessToken: string | undefined

        const { data: refreshData } = await supabase.auth.refreshSession()
        if (refreshData?.session) {
          accessToken = refreshData.session.access_token
        } else {
          // Fallback: cached session might still be valid
          const { data: fallback } = await supabase.auth.getSession()
          accessToken = fallback?.session?.access_token
        }

        if (!accessToken) {
          setError('Tu dois être connecté')
          setTimeout(() => navigate('/auth', { replace: true }), 2000)
          return
        }

        const redirectUri = `${window.location.origin}/auth/discord/callback`

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discord-oauth`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ code, redirect_uri: redirectUri }),
          }
        )

        let data: Record<string, unknown>
        try {
          data = await response.json()
        } catch {
          throw new Error(`Erreur serveur (${response.status}) — réponse non-JSON`)
        }

        if (!response.ok) {
          throw new Error(
            (data.error as string) ||
              (data.message as string) ||
              (data.msg as string) ||
              `Erreur serveur (${response.status})`
          )
        }

        // Update local profile state
        const profile = useAuthStore.getState().profile
        if (profile) {
          useAuthStore.setState({
            profile: {
              ...profile,
              discord_user_id: data.discord_user_id as string | null,
              discord_username: data.discord_username as string | null,
            },
          })
        }

        showSuccess(`Discord connecte : ${data.discord_username}`)
        navigate('/settings#connected', { replace: true })
      } catch (err) {
        const message = (err as Error).message
        setError(message)
        showError(message)
        setTimeout(() => navigate('/settings', { replace: true }), 3000)
      }
    }

    exchangeCode(code)
  }, [searchParams, navigate])

  return (
    <main className="flex items-center justify-center min-h-screen bg-bg-base">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <div className="w-12 h-12 mx-auto rounded-full bg-error/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-error"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-md text-text-primary">{error}</p>
            <p className="text-sm text-text-quaternary">Redirection...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-md text-text-primary">Connexion de ton compte Discord...</p>
            <p className="text-sm text-text-quaternary">Ca ne prend qu'un instant</p>
          </>
        )}
      </div>
    </main>
  )
}
