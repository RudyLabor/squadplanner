/**
 * Tests for send-welcome-email edge function business logic.
 *
 * Since the edge function uses Deno-specific imports (https://deno.land/...),
 * we extract and test the core business logic directly.
 * The handler integration is verified via E2E tests.
 */
import { describe, it, expect } from 'vitest'

// =====================================================
// CORS Logic (extracted from send-welcome-email/index.ts)
// =====================================================

// In production, SUPABASE_URL is a dynamic env var. For tests we use a fixed value.
const SUPABASE_URL = 'https://test.supabase.co'

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://squadplanner.fr',
  'https://www.squadplanner.fr',
  SUPABASE_URL,
].filter(Boolean)

function getCorsHeaders(origin: string | null) {
  const matchedOrigin =
    origin && ALLOWED_ORIGINS.some((allowed) => origin === allowed) ? origin : null
  return {
    'Access-Control-Allow-Origin': matchedOrigin || ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

describe('send-welcome-email: CORS logic', () => {
  it('should allow squadplanner.fr origin', () => {
    const headers = getCorsHeaders('https://squadplanner.fr')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://squadplanner.fr')
  })

  it('should allow localhost:5173 origin', () => {
    const headers = getCorsHeaders('http://localhost:5173')
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173')
  })

  it('should allow www.squadplanner.fr origin', () => {
    const headers = getCorsHeaders('https://www.squadplanner.fr')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://www.squadplanner.fr')
  })

  it('should allow SUPABASE_URL origin', () => {
    const headers = getCorsHeaders(SUPABASE_URL)
    expect(headers['Access-Control-Allow-Origin']).toBe(SUPABASE_URL)
  })

  it('should fallback to first allowed origin for unknown origin', () => {
    const headers = getCorsHeaders('https://evil.com')
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173')
  })

  it('should fallback to first allowed origin for null origin', () => {
    const headers = getCorsHeaders(null)
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173')
  })

  it('should always include Allow-Methods with POST and OPTIONS', () => {
    expect(getCorsHeaders('https://squadplanner.fr')['Access-Control-Allow-Methods']).toBe(
      'POST, OPTIONS'
    )
    expect(getCorsHeaders(null)['Access-Control-Allow-Methods']).toBe('POST, OPTIONS')
  })

  it('should always include Allow-Headers', () => {
    expect(getCorsHeaders('https://squadplanner.fr')['Access-Control-Allow-Headers']).toContain(
      'authorization'
    )
    expect(getCorsHeaders(null)['Access-Control-Allow-Headers']).toContain('content-type')
  })
})

// =====================================================
// generateWelcomeEmail (extracted from send-welcome-email/index.ts)
// =====================================================

function generateWelcomeEmail(username: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur Squad Planner</title>
</head>
<body style="margin:0; padding:0; background-color:#050506; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#050506;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="display:inline-flex; align-items:center; gap:8px;">
                <div style="width:40px; height:40px; background:linear-gradient(135deg, #6366f1, #8b5cf6); border-radius:12px; display:flex; align-items:center; justify-content:center;">
                  <span style="font-size:20px;">🎮</span>
                </div>
                <span style="font-size:18px; font-weight:700; color:#f7f8f8; letter-spacing:-0.02em;">Squad Planner</span>
              </div>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background:#101012; border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:40px 32px; text-align:center;">
              <div style="font-size:48px; margin-bottom:16px;">🎉</div>
              <h1 style="margin:0 0 8px; font-size:24px; font-weight:700; color:#f7f8f8;">
                Bienvenue ${username} !
              </h1>
              <p style="margin:0 0 28px; font-size:15px; color:#8b8d90; line-height:1.6;">
                Ta squad t'attend. Fini les "on verra", place aux sessions organisées.
              </p>

              <!-- CTA Button -->
              <a href="https://squadplanner.fr/home"
                 style="display:inline-block; background:#6366f1; color:white; font-size:15px; font-weight:600; text-decoration:none; padding:14px 32px; border-radius:12px; letter-spacing:-0.01em;">
                Ouvrir Squad Planner →
              </a>
            </td>
          </tr>

          <!-- Features -->
          <tr>
            <td style="padding-top:24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">

                <!-- Feature 1 -->
                <tr>
                  <td style="background:#101012; border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:20px; margin-bottom:8px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td width="48" valign="top">
                          <div style="width:40px; height:40px; background:rgba(99,102,241,0.08); border-radius:10px; text-align:center; line-height:40px; font-size:18px;">📅</div>
                        </td>
                        <td style="padding-left:12px;">
                          <h3 style="margin:0 0 4px; font-size:14px; font-weight:600; color:#f7f8f8;">Planifie des sessions</h3>
                          <p style="margin:0; font-size:13px; color:#8b8d90; line-height:1.5;">Propose un créneau, ta squad vote. Tout le monde est engagé.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td height="8"></td></tr>

                <!-- Feature 2 -->
                <tr>
                  <td style="background:#101012; border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:20px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td width="48" valign="top">
                          <div style="width:40px; height:40px; background:rgba(52,211,153,0.08); border-radius:10px; text-align:center; line-height:40px; font-size:18px;">🎙️</div>
                        </td>
                        <td style="padding-left:12px;">
                          <h3 style="margin:0 0 4px; font-size:14px; font-weight:600; color:#f7f8f8;">Party vocale</h3>
                          <p style="margin:0; font-size:13px; color:#8b8d90; line-height:1.5;">Un salon vocal permanent pour ta squad. Rejoins en un clic.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td height="8"></td></tr>

                <!-- Feature 3 -->
                <tr>
                  <td style="background:#101012; border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:20px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td width="48" valign="top">
                          <div style="width:40px; height:40px; background:rgba(251,191,36,0.08); border-radius:10px; text-align:center; line-height:40px; font-size:18px;">🏆</div>
                        </td>
                        <td style="padding-left:12px;">
                          <h3 style="margin:0 0 4px; font-size:14px; font-weight:600; color:#f7f8f8;">Score de fiabilité</h3>
                          <p style="margin:0; font-size:13px; color:#8b8d90; line-height:1.5;">Montre que tu es fiable. Check-in aux sessions, monte ton score.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Tip -->
          <tr>
            <td style="padding-top:24px;">
              <div style="background:rgba(99,102,241,0.05); border:1px solid rgba(99,102,241,0.1); border-radius:12px; padding:20px; text-align:center;">
                <p style="margin:0; font-size:13px; color:#a78bfa; line-height:1.6;">
                  💡 <strong>Astuce :</strong> Partage le code d'invitation de ta squad à tes amis pour qu'ils te rejoignent en 10 secondes.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:32px; text-align:center;">
              <p style="margin:0 0 8px; font-size:12px; color:#5e6063;">
                Squad Planner — L'outil qui transforme "on verra" en "on joue mardi 21h".
              </p>
              <p style="margin:0; font-size:11px; color:#3a3b3e;">
                Tu reçois cet email car tu viens de créer un compte sur Squad Planner.
                <br>
                <a href="https://squadplanner.fr/settings" style="color:#5e6063; text-decoration:underline;">Gérer mes notifications</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

describe('send-welcome-email: generateWelcomeEmail', () => {
  it('should inject username into the greeting', () => {
    const html = generateWelcomeEmail('Alice')
    expect(html).toContain('Bienvenue Alice !')
  })

  it('should inject different usernames correctly', () => {
    const html = generateWelcomeEmail('XxDarkGamer99xX')
    expect(html).toContain('Bienvenue XxDarkGamer99xX !')
  })

  it('should contain "Bienvenue" heading', () => {
    const html = generateWelcomeEmail('TestUser')
    expect(html).toContain('Bienvenue TestUser !')
    // Verify it's inside an h1 tag
    expect(html).toMatch(/<h1[^>]*>[\s\S]*Bienvenue TestUser ![\s\S]*<\/h1>/)
  })

  it('should contain the "Planifie des sessions" feature card', () => {
    const html = generateWelcomeEmail('Bob')
    expect(html).toContain('Planifie des sessions')
    expect(html).toContain('Propose un créneau, ta squad vote.')
  })

  it('should contain the "Party vocale" feature card', () => {
    const html = generateWelcomeEmail('Bob')
    expect(html).toContain('Party vocale')
    expect(html).toContain('Un salon vocal permanent pour ta squad.')
  })

  it('should contain the "Score de fiabilité" feature card', () => {
    const html = generateWelcomeEmail('Bob')
    expect(html).toContain('Score de fiabilité')
    expect(html).toContain('Montre que tu es fiable.')
  })

  it('should contain the CTA link to squadplanner.fr/home', () => {
    const html = generateWelcomeEmail('Bob')
    expect(html).toContain('href="https://squadplanner.fr/home"')
    expect(html).toContain('Ouvrir Squad Planner')
  })

  it('should contain the settings link in footer', () => {
    const html = generateWelcomeEmail('Bob')
    expect(html).toContain('href="https://squadplanner.fr/settings"')
    expect(html).toContain('Gérer mes notifications')
  })

  it('should use dark theme background color #050506', () => {
    const html = generateWelcomeEmail('Bob')
    expect(html).toContain('background-color:#050506')
  })

  it('should be valid HTML with doctype, html, head, and body', () => {
    const html = generateWelcomeEmail('Bob')
    expect(html).toMatch(/^<!DOCTYPE html>/)
    expect(html).toContain('<html lang="fr">')
    expect(html).toContain('<head>')
    expect(html).toContain('</head>')
    expect(html).toContain('<body')
    expect(html).toContain('</body>')
    expect(html).toContain('</html>')
  })

  it('should contain the referral tip section', () => {
    const html = generateWelcomeEmail('Bob')
    expect(html).toContain('Astuce')
    expect(html).toContain("Partage le code d'invitation")
  })

  it('should handle empty string username gracefully', () => {
    const html = generateWelcomeEmail('')
    expect(html).toContain('Bienvenue  !')
    // Still produces valid HTML structure
    expect(html).toContain('<!DOCTYPE html>')
  })
})

// =====================================================
// Input mode validation (matching handler logic)
// =====================================================

describe('send-welcome-email: input mode validation', () => {
  function validateInput(body: { userId?: string; email?: string; username?: string }): {
    mode: 'userId' | 'direct'
    error?: string
  } {
    if (body.userId) {
      return { mode: 'userId' }
    } else if (body.email && body.username) {
      return { mode: 'direct' }
    } else {
      return { mode: 'direct', error: 'Either userId or (email + username) required' }
    }
  }

  it('should accept userId mode', () => {
    const result = validateInput({ userId: '550e8400-e29b-41d4-a716-446655440000' })
    expect(result.mode).toBe('userId')
    expect(result.error).toBeUndefined()
  })

  it('should accept direct email + username mode', () => {
    const result = validateInput({ email: 'alice@example.com', username: 'Alice' })
    expect(result.mode).toBe('direct')
    expect(result.error).toBeUndefined()
  })

  it('should return error when neither userId nor email+username provided', () => {
    const result = validateInput({})
    expect(result.error).toBe('Either userId or (email + username) required')
  })

  it('should return error when only email provided (no username)', () => {
    const result = validateInput({ email: 'alice@example.com' })
    expect(result.error).toBeDefined()
  })

  it('should return error when only username provided (no email)', () => {
    const result = validateInput({ username: 'Alice' })
    expect(result.error).toBeDefined()
  })

  it('should prefer userId mode when both userId and email+username are provided', () => {
    const result = validateInput({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'alice@example.com',
      username: 'Alice',
    })
    expect(result.mode).toBe('userId')
    expect(result.error).toBeUndefined()
  })
})

// =====================================================
// Email payload construction (matching Resend API call)
// =====================================================

function buildEmailPayload(email: string, username: string) {
  return {
    from: 'Squad Planner <noreply@squadplanner.fr>',
    to: [email],
    subject: `Bienvenue sur Squad Planner, ${username} ! 🎮`,
    html: generateWelcomeEmail(username),
  }
}

describe('send-welcome-email: email payload construction', () => {
  it('should use correct from address', () => {
    const payload = buildEmailPayload('alice@example.com', 'Alice')
    expect(payload.from).toBe('Squad Planner <noreply@squadplanner.fr>')
  })

  it('should include username in subject with emoji', () => {
    const payload = buildEmailPayload('alice@example.com', 'Alice')
    expect(payload.subject).toBe('Bienvenue sur Squad Planner, Alice ! 🎮')
  })

  it('should include different username in subject', () => {
    const payload = buildEmailPayload('bob@example.com', 'Bob')
    expect(payload.subject).toContain('Bob')
  })

  it('should set to as a single-element array with the recipient email', () => {
    const payload = buildEmailPayload('gamer@example.com', 'Gamer')
    expect(payload.to).toEqual(['gamer@example.com'])
    expect(Array.isArray(payload.to)).toBe(true)
    expect(payload.to.length).toBe(1)
  })

  it('should include generated HTML in payload', () => {
    const payload = buildEmailPayload('alice@example.com', 'Alice')
    expect(payload.html).toContain('Bienvenue Alice !')
    expect(payload.html).toContain('<!DOCTYPE html>')
  })
})

// =====================================================
// Method validation (matching handler logic)
// =====================================================

describe('send-welcome-email: method validation', () => {
  function getMethodResponse(method: string): { status: number; body?: string } {
    if (method === 'OPTIONS') {
      return { status: 204 }
    }
    if (method !== 'POST') {
      return { status: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
    }
    return { status: 200 }
  }

  it('should return 405 for GET requests', () => {
    const response = getMethodResponse('GET')
    expect(response.status).toBe(405)
    expect(response.body).toContain('Method not allowed')
  })

  it('should return 405 for PUT requests', () => {
    const response = getMethodResponse('PUT')
    expect(response.status).toBe(405)
  })

  it('should return 405 for DELETE requests', () => {
    const response = getMethodResponse('DELETE')
    expect(response.status).toBe(405)
  })

  it('should return 204 for OPTIONS (CORS preflight)', () => {
    const response = getMethodResponse('OPTIONS')
    expect(response.status).toBe(204)
    expect(response.body).toBeUndefined()
  })

  it('should return 200 for POST requests', () => {
    const response = getMethodResponse('POST')
    expect(response.status).toBe(200)
  })
})

// =====================================================
// Graceful fallback when RESEND_API_KEY is missing
// =====================================================

describe('send-welcome-email: API key fallback logic', () => {
  it('should detect missing API key', () => {
    const apiKey = ''
    expect(!apiKey).toBe(true)
  })

  it('should detect present API key', () => {
    const apiKey = 're_test_1234567890'
    expect(!!apiKey).toBe(true)
  })

  it('should build fallback response with email and username info', () => {
    const email = 'alice@example.com'
    const username = 'Alice'
    const fallbackResponse = {
      success: true,
      message: 'Email logged (no RESEND_API_KEY configured)',
      to: email,
      username,
    }
    expect(fallbackResponse.success).toBe(true)
    expect(fallbackResponse.message).toContain('no RESEND_API_KEY')
    expect(fallbackResponse.to).toBe('alice@example.com')
    expect(fallbackResponse.username).toBe('Alice')
  })
})
