/**
 * Tests for og-image edge function business logic.
 *
 * Since the edge function uses Deno-specific imports (https://deno.land/...),
 * we extract and test the core business logic directly.
 * The handler integration is verified via E2E tests.
 */
import { describe, it, expect } from 'vitest'

// =====================================================
// formatDate (extracted from og-image/index.ts)
// =====================================================

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate)
    if (isNaN(d.getTime())) return ''
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
    return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]} \u00b7 ${String(d.getUTCHours()).padStart(2, '0')}h${String(d.getUTCMinutes()).padStart(2, '0')}`
  } catch {
    return ''
  }
}

describe('og-image: formatDate', () => {
  it('should format a Sunday evening date correctly', () => {
    // 2025-01-19 is a Sunday
    const result = formatDate('2025-01-19T20:00:00Z')
    expect(result).toBe('Dim 19 jan \u00b7 20h00')
  })

  it('should format a Wednesday midday date correctly', () => {
    // 2025-03-05 is a Wednesday
    const result = formatDate('2025-03-05T12:30:00Z')
    expect(result).toBe('Mer 5 mar \u00b7 12h30')
  })

  it('should zero-pad hours and minutes', () => {
    // 2025-06-02 is a Monday
    const result = formatDate('2025-06-02T03:05:00Z')
    expect(result).toBe('Lun 2 jun \u00b7 03h05')
  })

  it('should handle midnight correctly', () => {
    // 2025-12-25 is a Thursday
    const result = formatDate('2025-12-25T00:00:00Z')
    expect(result).toBe('Jeu 25 dec \u00b7 00h00')
  })

  it('should return empty string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('')
  })

  it('should return empty string for empty string input', () => {
    expect(formatDate('')).toBe('')
  })

  it('should handle a Saturday in August', () => {
    // 2025-08-16 is a Saturday
    const result = formatDate('2025-08-16T18:45:00Z')
    expect(result).toBe('Sam 16 aou \u00b7 18h45')
  })
})

// =====================================================
// escapeXml (extracted from og-image/index.ts)
// =====================================================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

describe('og-image: escapeXml', () => {
  it('should escape ampersand', () => {
    expect(escapeXml('A & B')).toBe('A &amp; B')
  })

  it('should escape less-than sign', () => {
    expect(escapeXml('a < b')).toBe('a &lt; b')
  })

  it('should escape greater-than sign', () => {
    expect(escapeXml('a > b')).toBe('a &gt; b')
  })

  it('should escape double quotes', () => {
    expect(escapeXml('say "hello"')).toBe('say &quot;hello&quot;')
  })

  it('should escape single quotes (apostrophes)', () => {
    expect(escapeXml("it's")).toBe('it&apos;s')
  })

  it('should escape multiple special characters combined', () => {
    expect(escapeXml('<div class="x">&\'test\'</div>')).toBe(
      '&lt;div class=&quot;x&quot;&gt;&amp;&apos;test&apos;&lt;/div&gt;'
    )
  })

  it('should leave string unchanged when no special chars', () => {
    expect(escapeXml('Hello World 123')).toBe('Hello World 123')
  })
})

// =====================================================
// truncate (extracted from og-image/index.ts)
// =====================================================

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '\u2026' : str
}

describe('og-image: truncate', () => {
  it('should return string unchanged when within limit', () => {
    expect(truncate('Hello', 10)).toBe('Hello')
  })

  it('should truncate and add ellipsis when over limit', () => {
    const result = truncate('This is a very long title that exceeds the limit', 20)
    expect(result).toBe('This is a very long\u2026')
    expect(result.length).toBe(20)
  })

  it('should return string unchanged when exactly at limit', () => {
    expect(truncate('12345', 5)).toBe('12345')
  })

  it('should handle empty string', () => {
    expect(truncate('', 10)).toBe('')
  })

  it('should truncate to single char + ellipsis when max is 2', () => {
    expect(truncate('Hello', 2)).toBe('H\u2026')
  })
})

// =====================================================
// generateSessionSvg (extracted from og-image/index.ts)
// =====================================================

interface SessionData {
  title: string
  game: string
  squadName: string
  scheduledAt: string
  durationMinutes: number
  rsvpCount: number
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

const baseSessionData: SessionData = {
  title: 'Ranked Valorant',
  game: 'Valorant',
  squadName: 'Les Gamers',
  scheduledAt: '2025-01-19T20:00:00Z',
  durationMinutes: 60,
  rsvpCount: 3,
}

describe('og-image: generateSessionSvg', () => {
  it('should return a valid SVG string', () => {
    const svg = generateSessionSvg(baseSessionData)
    expect(svg).toMatch(/^<svg/)
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(svg).toContain('width="1200"')
    expect(svg).toContain('height="630"')
  })

  it('should contain the session title', () => {
    const svg = generateSessionSvg(baseSessionData)
    expect(svg).toContain('Ranked Valorant')
  })

  it('should contain the squad name', () => {
    const svg = generateSessionSvg(baseSessionData)
    expect(svg).toContain('Les Gamers')
  })

  it('should contain the formatted date', () => {
    const svg = generateSessionSvg(baseSessionData)
    // 2025-01-19 Sunday 20:00 UTC
    expect(svg).toContain('Dim 19 jan')
    expect(svg).toContain('20h00')
  })

  it('should contain the duration', () => {
    const svg = generateSessionSvg(baseSessionData)
    expect(svg).toContain('60min')
  })

  it('should pluralize joueurs for count > 1', () => {
    const svg = generateSessionSvg({ ...baseSessionData, rsvpCount: 5 })
    expect(svg).toContain('5 joueurs')
  })

  it('should use singular joueur for count === 1', () => {
    const svg = generateSessionSvg({ ...baseSessionData, rsvpCount: 1 })
    expect(svg).toContain('1 joueur')
    expect(svg).not.toContain('1 joueurs')
  })

  it('should include game badge when game is provided', () => {
    const svg = generateSessionSvg(baseSessionData)
    // Game badge renders a rect at y="120" and the game text
    expect(svg).toContain('Valorant')
    expect(svg).toContain('rx="16" ry="16"')
  })

  it('should NOT include game badge when game is empty string', () => {
    const svg = generateSessionSvg({ ...baseSessionData, game: '' })
    // When no game, the game badge block is replaced by empty string
    // Title y is "200" instead of "230"
    expect(svg).toContain('y="200"')
    expect(svg).not.toContain('y="230"')
  })

  it('should escape special XML characters in title', () => {
    const svg = generateSessionSvg({
      ...baseSessionData,
      title: 'Rush B & Win <3',
    })
    expect(svg).toContain('Rush B &amp; Win &lt;3')
    expect(svg).not.toContain('Rush B & Win <3')
  })
})

// =====================================================
// generateFallbackSvg (extracted from og-image/index.ts)
// =====================================================

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

describe('og-image: generateFallbackSvg', () => {
  it('should return a valid SVG string', () => {
    const svg = generateFallbackSvg()
    expect(svg).toMatch(/^<svg/)
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
  })

  it('should have 1200x630 dimensions', () => {
    const svg = generateFallbackSvg()
    expect(svg).toContain('width="1200"')
    expect(svg).toContain('height="630"')
  })

  it('should contain "Squad Planner" text', () => {
    const svg = generateFallbackSvg()
    expect(svg).toContain('Squad Planner')
  })

  it('should contain the CTA "Rejoindre gratuitement"', () => {
    const svg = generateFallbackSvg()
    expect(svg).toContain('Rejoindre gratuitement')
  })

  it('should contain the site URL', () => {
    const svg = generateFallbackSvg()
    expect(svg).toContain('squadplanner.fr')
  })
})
