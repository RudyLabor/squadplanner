import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import type { MetaArgs } from 'react-router'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'

export function headers() {
  return {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  }
}
import { ShareButtons } from '../components/ShareButtons'

interface SessionPreview {
  id: string
  title: string | null
  game: string | null
  scheduled_at: string
  duration_minutes: number
  status: string
  squad_name: string
  rsvp_count: number
}

export function meta({ params }: MetaArgs) {
  const sessionId = params.id || ''
  const ogImageUrl = `https://nxbqiwmfyafgshxzczxo.supabase.co/functions/v1/og-image?sessionId=${sessionId}`

  return [
    { title: 'Session Gaming - Squad Planner' },
    {
      name: 'description',
      content: 'Rejoins cette session gaming sur Squad Planner !',
    },
    { name: 'robots', content: 'noindex, nofollow' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:title', content: 'Session Gaming - Squad Planner' },
    {
      property: 'og:description',
      content: 'Rejoins cette session gaming sur Squad Planner !',
    },
    { property: 'og:image', content: ogImageUrl },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Session Gaming - Squad Planner' },
    {
      name: 'twitter:description',
      content: 'Rejoins cette session gaming sur Squad Planner !',
    },
    { name: 'twitter:image', content: ogImageUrl },
  ]
}

export default function SessionSharePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionPreview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    async function fetchSession() {
      setIsLoading(true)
      try {
        // Fetch session with squad name
        const { data, error: fetchError } = await supabase
          .from('sessions')
          .select(
            `
            id,
            title,
            game,
            scheduled_at,
            duration_minutes,
            status,
            squad_id
          `
          )
          .eq('id', id)
          .single()

        if (fetchError || !data) {
          setError('Session introuvable')
          return
        }

        // Get squad name
        const { data: squad } = await supabase
          .from('squads')
          .select('name')
          .eq('id', data.squad_id)
          .single()

        // Get RSVP count
        const { count } = await supabase
          .from('session_rsvps')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', data.id)
          .eq('response', 'present')

        setSession({
          id: data.id,
          title: data.title,
          game: data.game,
          scheduled_at: data.scheduled_at,
          duration_minutes: data.duration_minutes,
          status: data.status,
          squad_name: squad?.name || 'Squad',
          rsvp_count: count || 0,
        })
      } catch {
        setError('Erreur lors du chargement')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [id])

  const handleJoin = () => {
    navigate('/auth')
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-base px-4">
        <h1 className="text-xl font-bold text-text-primary">Session introuvable</h1>
        <p className="text-sm text-text-secondary">
          Cette session n'existe pas ou a été supprimée.
        </p>
        <button
          onClick={() => navigate('/')}
          className="rounded-xl bg-primary-bg px-6 py-3 text-sm font-semibold text-white"
        >
          Découvrir Squad Planner
        </button>
      </div>
    )
  }

  const sessionDate = new Date(session.scheduled_at)
  const isPast = sessionDate < new Date()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-4 py-8">
      <div className="w-full max-w-md">
        {/* Session Card */}
        <div className="rounded-2xl bg-bg-card p-6 shadow-lg ring-1 ring-border">
          {/* Badge */}
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {session.squad_name}
            </span>
            {session.game && (
              <span className="rounded-full bg-bg-base px-3 py-1 text-xs font-medium text-text-secondary">
                {session.game}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="mb-2 text-xl font-bold text-text-primary">
            {session.title || `Session ${session.game || 'Gaming'}`}
          </h1>

          {/* Date & Time */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
              <span>
                {sessionDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {sessionDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} —{' '}
                {session.duration_minutes} min
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
              <span>
                {session.rsvp_count} joueur{session.rsvp_count > 1 ? 's' : ''} confirmé
                {session.rsvp_count > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* CTA */}
          {isPast ? (
            <div className="rounded-xl bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-500">
              Cette session est terminée
            </div>
          ) : (
            <div>
              <button
                onClick={handleJoin}
                className="w-full rounded-xl bg-primary-bg px-6 py-3 text-center text-sm font-semibold text-white transition-transform active:scale-[0.98]"
              >
                Rejoindre la session — gratuit
              </button>
              <p className="mt-2 text-center text-xs text-text-tertiary">
                Inscription en 30 secondes. 100% gratuit.
              </p>
            </div>
          )}

          {/* Share */}
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 text-xs font-medium text-text-secondary">Partager cette session</p>
            <ShareButtons
              url={shareUrl}
              title={session.title || `Session ${session.game || 'Gaming'}`}
              text={`Rejoins la session ${session.game ? session.game + ' ' : ''}sur Squad Planner !`}
            />
          </div>
        </div>

        {/* Squad Planner explainer for non-users */}
        <div className="mt-6 rounded-2xl bg-bg-card p-5 ring-1 ring-border">
          <h3 className="mb-2 text-sm font-bold text-text-primary">Squad Planner, c'est quoi ?</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            L'app qui permet aux gamers de planifier leurs sessions, confirmer les présences et jouer ensemble. Plus de ghosting.
          </p>
        </div>

        {/* Footer CTA */}
        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary">Planifie tes sessions gaming avec ta squad</p>
          <a
            href="/"
            className="mt-1 inline-block text-sm font-semibold text-primary hover:underline"
          >
            Découvrir Squad Planner
          </a>
        </div>
      </div>
    </div>
  )
}
