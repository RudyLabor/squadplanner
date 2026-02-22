import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

/**
 * OG Image Edge Function — Phase 1.5
 *
 * Generates dynamic Open Graph images (SVG) for shared sessions.
 * Used by social platforms (Twitter/X, Discord, WhatsApp) when a
 * session share link (/s/:id) is posted.
 *
 * Usage: GET /functions/v1/og-image?sessionId=xxx
 * Returns: image/svg+xml (1200x630)
 */

const CACHE_SECONDS = 3600

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    })
  }

  try {
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('sessionId')

    if (!sessionId) {
      return new Response(generateFallbackSvg(), {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
        },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch session data
    const { data: session } = await supabase
      .from('sessions')
      .select('id, title, game, scheduled_at, duration_minutes, status, squad_id')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return new Response(generateFallbackSvg(), {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
        },
      })
    }

    // Fetch squad name
    const { data: squad } = await supabase
      .from('squads')
      .select('name')
      .eq('id', session.squad_id)
      .single()

    // Fetch RSVP count
    const { count: rsvpCount } = await supabase
      .from('session_rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session.id)
      .eq('response', 'present')

    const svg = generateSessionSvg({
      title: session.title || 'Session Gaming',
      game: session.game || '',
      squadName: squad?.name || 'Squad',
      scheduledAt: session.scheduled_at,
      durationMinutes: session.duration_minutes || 60,
      rsvpCount: rsvpCount || 0,
    })

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
      },
    })
  } catch (error) {
    return new Response(generateFallbackSvg(), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60',
      },
    })
  }
})

// ─── SVG GENERATION ────────────────────────────────

interface SessionData {
  title: string
  game: string
  squadName: string
  scheduledAt: string
  durationMinutes: number
  rsvpCount: number
}

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate)
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    const months = [
      'jan',
      'fev',
      'mar',
      'avr',
      'mai',
      'jun',
      'jul',
      'aou',
      'sep',
      'oct',
      'nov',
      'dec',
    ]
    return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]} · ${String(d.getUTCHours()).padStart(2, '0')}h${String(d.getUTCMinutes()).padStart(2, '0')}`
  } catch {
    return ''
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

function generateSessionSvg(data: SessionData): string {
  const title = escapeXml(truncate(data.title, 40))
  const game = escapeXml(truncate(data.game, 30))
  const squad = escapeXml(truncate(data.squadName, 25))
  const date = escapeXml(formatDate(data.scheduledAt))
  const duration = `${data.durationMinutes}min`
  const players = `${data.rsvpCount} joueur${data.rsvpCount !== 1 ? 's' : ''}`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f"/>
      <stop offset="100%" style="stop-color:#12121f"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#6c5ce7"/>
      <stop offset="100%" style="stop-color:#a29bfe"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f0a500"/>
      <stop offset="100%" style="stop-color:#ffd166"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Decorative elements -->
  <circle cx="1100" cy="80" r="180" fill="#6c5ce7" opacity="0.06"/>
  <circle cx="100" cy="550" r="120" fill="#f0a500" opacity="0.05"/>

  <!-- Top accent line -->
  <rect x="0" y="0" width="1200" height="4" fill="url(#accent)"/>

  <!-- Logo area -->
  <text x="80" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" fill="#6c5ce7">
    Squad Planner
  </text>

  <!-- Game badge -->
  ${
    game
      ? `<rect x="80" y="120" rx="16" ry="16" width="${Math.min(game.length * 14 + 40, 400)}" height="40" fill="#6c5ce7" opacity="0.15"/>
  <text x="100" y="147" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="#a29bfe">
    ${game}
  </text>`
      : ''
  }

  <!-- Session title -->
  <text x="80" y="${game ? '230' : '200'}" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="800" fill="#ffffff">
    ${title}
  </text>

  <!-- Squad name -->
  <text x="80" y="${game ? '290' : '260'}" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="500" fill="#8888aa">
    ${squad}
  </text>

  <!-- Info cards row -->
  <g transform="translate(80, ${game ? '340' : '310'})">
    <!-- Date card -->
    <rect rx="12" ry="12" width="340" height="70" fill="#ffffff" opacity="0.05"/>
    <text x="20" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#6c5ce7">
      DATE
    </text>
    <text x="20" y="54" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600" fill="#ffffff">
      ${date}
    </text>

    <!-- Duration card -->
    <rect x="360" rx="12" ry="12" width="180" height="70" fill="#ffffff" opacity="0.05"/>
    <text x="380" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#f0a500">
      DUREE
    </text>
    <text x="380" y="54" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600" fill="#ffffff">
      ${duration}
    </text>

    <!-- Players card -->
    <rect x="560" rx="12" ry="12" width="220" height="70" fill="#ffffff" opacity="0.05"/>
    <text x="580" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#00b894">
      CONFIRMES
    </text>
    <text x="580" y="54" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600" fill="#ffffff">
      ${players}
    </text>
  </g>

  <!-- CTA -->
  <rect x="80" y="510" rx="16" ry="16" width="320" height="56" fill="url(#accent)"/>
  <text x="150" y="546" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="#ffffff">
    Rejoindre la session
  </text>

  <!-- URL -->
  <text x="1120" y="590" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500" fill="#555577" text-anchor="end">
    squadplanner.fr
  </text>
</svg>`
}

function generateFallbackSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f"/>
      <stop offset="100%" style="stop-color:#12121f"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#6c5ce7"/>
      <stop offset="100%" style="stop-color:#a29bfe"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="4" fill="url(#accent)"/>
  <text x="600" y="260" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="800" fill="#ffffff" text-anchor="middle">
    Squad Planner
  </text>
  <text x="600" y="320" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="500" fill="#8888aa" text-anchor="middle">
    Planifie tes sessions gaming avec ta squad
  </text>
  <rect x="440" y="400" rx="16" ry="16" width="320" height="56" fill="url(#accent)"/>
  <text x="510" y="436" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="#ffffff">
    Rejoindre gratuitement
  </text>
  <text x="600" y="590" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500" fill="#555577" text-anchor="middle">
    squadplanner.fr
  </text>
</svg>`
}
