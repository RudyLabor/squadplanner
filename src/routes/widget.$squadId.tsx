/**
 * Widget embarquable pour les streamers / sites externes.
 * Affiche les prochaines sessions d'une squad dans un format compact.
 * Usage: <iframe src="https://squadplanner.fr/widget/SQUAD_ID" width="320" height="420" />
 */

import { useState, useEffect } from 'react'
import type { HeadersArgs } from 'react-router'
import { useParams } from 'react-router'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'

export function headers(_args: HeadersArgs) {
  return {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    // Allow embedding in iframes
    'X-Frame-Options': 'ALLOWALL',
  }
}

export function meta() {
  return [
    { title: 'Squad Planner Widget' },
    { name: 'robots', content: 'noindex, nofollow' },
  ]
}

interface WidgetSession {
  id: string
  title: string
  scheduled_at: string
  rsvp_count: number
}

interface WidgetSquad {
  name: string
  invite_code: string | null
  member_count: number
}

export default function WidgetPage() {
  const { squadId } = useParams<{ squadId: string }>()
  const [squad, setSquad] = useState<WidgetSquad | null>(null)
  const [sessions, setSessions] = useState<WidgetSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!squadId) return
    async function fetchData() {
      try {
        // Fetch squad info
        const { data: squadData } = await supabase
          .from('squads')
          .select('name, invite_code')
          .eq('id', squadId)
          .single()

        if (!squadData) {
          setError(true)
          setLoading(false)
          return
        }

        // Count members
        const { count } = await supabase
          .from('squad_members')
          .select('id', { count: 'exact', head: true })
          .eq('squad_id', squadId)

        setSquad({
          name: squadData.name,
          invite_code: squadData.invite_code,
          member_count: count || 0,
        })

        // Fetch upcoming sessions
        const { data: sessionsData } = await supabase
          .from('sessions')
          .select('id, title, scheduled_at')
          .eq('squad_id', squadId)
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(3)

        const enriched: WidgetSession[] = await Promise.all(
          (sessionsData || []).map(async (s) => {
            const { count: rsvpCount } = await supabase
              .from('session_rsvps')
              .select('id', { count: 'exact', head: true })
              .eq('session_id', s.id)
              .eq('response', 'yes')
            return { ...s, rsvp_count: rsvpCount || 0 }
          })
        )

        setSessions(enriched)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [squadId])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const day = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return { day, time }
  }

  // Minimal dark theme for iframe embedding
  return (
    <div
      style={{
        fontFamily: "'Inter', -apple-system, sans-serif",
        background: '#0f0f14',
        color: '#e4e4e7',
        minHeight: '100vh',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#71717a' }}>
          Chargement...
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: '#71717a', marginBottom: '8px' }}>Squad introuvable</p>
          <a
            href="https://squadplanner.fr"
            target="_blank"
            rel="noopener"
            style={{ color: '#a78bfa', fontSize: '14px' }}
          >
            squadplanner.fr
          </a>
        </div>
      )}

      {!loading && !error && squad && (
        <>
          {/* Squad header */}
          <div style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                margin: '0 0 4px 0',
                color: '#f4f4f5',
              }}
            >
              {squad.name}
            </h2>
            <p style={{ fontSize: '13px', color: '#71717a', margin: 0 }}>
              {squad.member_count} membre{squad.member_count !== 1 ? 's' : ''} · Squad Planner
            </p>
          </div>

          {/* Sessions */}
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}
          >
            {sessions.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: '#71717a',
                  fontSize: '14px',
                  border: '1px solid #27272a',
                  borderRadius: '12px',
                }}
              >
                Aucune session prévue
              </div>
            ) : (
              sessions.map((s) => {
                const { day, time } = formatDate(s.scheduled_at)
                return (
                  <div
                    key={s.id}
                    style={{
                      padding: '12px',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                      background: '#18181b',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        margin: '0 0 4px 0',
                        color: '#f4f4f5',
                      }}
                    >
                      {s.title}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#a1a1aa',
                      }}
                    >
                      <span>
                        📅 {day} · {time}
                      </span>
                      <span>
                        ✅ {s.rsvp_count} confirmé{s.rsvp_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Join CTA */}
          {squad.invite_code && (
            <a
              href={`https://squadplanner.fr/join/${squad.invite_code}`}
              target="_blank"
              rel="noopener"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                textDecoration: 'none',
                marginBottom: '12px',
              }}
            >
              Rejoindre la squad
            </a>
          )}

          {/* Embed code hint */}
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: '#18181b',
              border: '1px solid #27272a',
            }}
          >
            <p style={{ fontSize: '10px', color: '#52525b', margin: '0 0 4px 0' }}>Code embed :</p>
            <code
              style={{
                fontSize: '9px',
                color: '#71717a',
                wordBreak: 'break-all',
                display: 'block',
                lineHeight: 1.4,
              }}
            >
              {`<iframe src="https://squadplanner.fr/widget/${squadId}" width="320" height="420" />`}
            </code>
          </div>

          {/* Powered by */}
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <a
              href="https://squadplanner.fr"
              target="_blank"
              rel="noopener"
              style={{ fontSize: '11px', color: '#52525b', textDecoration: 'none' }}
            >
              Powered by Squad Planner
            </a>
          </div>
        </>
      )}
    </div>
  )
}
