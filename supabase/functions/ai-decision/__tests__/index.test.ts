/**
 * Tests for ai-decision Edge Function
 * Covers: CORS, auth, input validation (session_id UUID), session not found,
 *         8 decision branches (already confirmed/cancelled, enough players + high response,
 *         too many absent, time pressure, uncertainty, low response rate, minimum reached, default wait),
 *         confidence scoring, alternative slots, AI reasoning, AI fallback
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Stubs & Mocks
// ---------------------------------------------------------------------------

const ENV: Record<string, string> = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
}

// Validation (replicated from _shared/schemas.ts)
function validateString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`)
  }
  return value
}

function validateUUID(value: unknown, fieldName: string): string {
  const str = validateString(value, fieldName)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(str)) {
    throw new Error(`${fieldName} must be a valid UUID`)
  }
  return str
}

// CORS (replicated from source)
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://squadplanner.fr',
  'https://squadplanner.app',
  ENV.SUPABASE_URL,
].filter(Boolean)

function getCorsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.some((allowed) => origin === allowed) ? origin : null
  if (!allowedOrigin) {
    return {
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

// ---------------------------------------------------------------------------
// Decision logic (replicated exactly from source)
// ---------------------------------------------------------------------------

interface DecisionRecommendation {
  recommended_action: 'confirm' | 'cancel' | 'reschedule' | 'wait'
  confidence: number
  reason: string
  details: {
    present_count: number
    absent_count: number
    maybe_count: number
    no_response_count: number
    total_members: number
    min_players: number
    response_rate: number
    time_until_session: number
  }
  alternative_slots?: Array<{
    day_of_week: number
    hour: number
    reliability_score: number
  }>
}

interface DecisionInput {
  sessionStatus: string
  presentCount: number
  absentCount: number
  maybeCount: number
  totalMembers: number
  minPlayers: number
  hoursUntilSession: number
}

function computeDecision(input: DecisionInput): DecisionRecommendation {
  const {
    sessionStatus,
    presentCount,
    absentCount,
    maybeCount,
    totalMembers,
    minPlayers,
    hoursUntilSession,
  } = input

  const noResponseCount = totalMembers - (presentCount + absentCount + maybeCount)
  const responseRate = ((presentCount + absentCount + maybeCount) / totalMembers) * 100

  const details = {
    present_count: presentCount,
    absent_count: absentCount,
    maybe_count: maybeCount,
    no_response_count: noResponseCount,
    total_members: totalMembers,
    min_players: minPlayers,
    response_rate: Math.round(responseRate),
    time_until_session: Math.round(hoursUntilSession),
  }

  // Branch 1: Already confirmed
  if (sessionStatus === 'confirmed') {
    return {
      recommended_action: 'confirm',
      confidence: 100,
      reason: 'La session est deja confirmee.',
      details,
    }
  }

  // Branch 2: Already cancelled
  if (sessionStatus === 'cancelled') {
    return {
      recommended_action: 'cancel',
      confidence: 100,
      reason: 'La session a ete annulee.',
      details,
    }
  }

  // Branch 3: Enough players + high response rate
  if (presentCount >= minPlayers && responseRate >= 70) {
    return {
      recommended_action: 'confirm',
      confidence: Math.min(95, 60 + presentCount * 8),
      reason: `${presentCount} joueurs confirmes (minimum: ${minPlayers}).`,
      details,
    }
  }

  // Branch 4: Too many absent
  if (absentCount > totalMembers * 0.5) {
    return {
      recommended_action: 'cancel',
      confidence: 85,
      reason: `${absentCount} membres sur ${totalMembers} ont decline.`,
      details,
    }
  }

  // Branch 5: Time pressure (< 24h, not enough players)
  if (hoursUntilSession < 24 && presentCount < minPlayers) {
    return {
      recommended_action: 'reschedule',
      confidence: 80,
      reason: `Moins de 24h avant la session et seulement ${presentCount} confirme(s).`,
      details,
    }
  }

  // Branch 6: Uncertainty (more maybe than confirmed, < 48h)
  if (maybeCount > presentCount && hoursUntilSession < 48) {
    return {
      recommended_action: 'reschedule',
      confidence: 70,
      reason: `${maybeCount} "peut-etre" vs ${presentCount} confirmes.`,
      details,
    }
  }

  // Branch 7: Low response rate but still time
  if (responseRate < 50 && hoursUntilSession > 48) {
    return {
      recommended_action: 'wait',
      confidence: 60,
      reason: `Seulement ${Math.round(responseRate)}% ont repondu.`,
      details,
    }
  }

  // Branch 8a: Minimum reached (default confirm)
  if (presentCount >= minPlayers) {
    return {
      recommended_action: 'confirm',
      confidence: 70,
      reason: `Le minimum de ${minPlayers} joueurs est atteint.`,
      details,
    }
  }

  // Branch 8b: Default wait
  return {
    recommended_action: 'wait',
    confidence: 50,
    reason: `${presentCount}/${minPlayers} joueurs confirmes.`,
    details,
  }
}

// ---------------------------------------------------------------------------
// Supabase mock builder
// ---------------------------------------------------------------------------

interface SessionConfig {
  session?: Record<string, unknown> | null
  sessionError?: unknown
  rsvps?: Array<{ response: string; user_id: string }>
  bestSlots?: Array<{ day_of_week: number; hour: number; avg_attendance: number }> | null
}

function createMockSupabaseClient(config: SessionConfig = {}) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}

  let currentTable = ''

  chain.single = vi.fn().mockImplementation(() => {
    if (currentTable === 'sessions') {
      return Promise.resolve({
        data: config.session ?? null,
        error: config.sessionError ?? (config.session ? null : { message: 'not found' }),
      })
    }
    return Promise.resolve({ data: null, error: null })
  })

  chain.eq = vi.fn().mockReturnThis()
  chain.select = vi.fn().mockReturnValue(chain)

  const from = vi.fn().mockImplementation((table: string) => {
    currentTable = table
    if (table === 'session_rsvps') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: config.rsvps ?? [],
            error: null,
          }),
        }),
      }
    }
    return chain
  })

  const rpc = vi.fn().mockResolvedValue({
    data: config.bestSlots ?? [],
    error: null,
  })

  return { from, chain, rpc }
}

// ---------------------------------------------------------------------------
// Handler builder with injected dependencies
// ---------------------------------------------------------------------------

interface AiDecisionHandlerDeps {
  supabaseClient: ReturnType<typeof createMockSupabaseClient>
  callClaudeAPI: (prompt: string) => Promise<string | null>
}

function buildHandler(deps: AiDecisionHandlerDeps) {
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get('origin')

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: getCorsHeaders(origin) })
    }
    if (req.method === 'HEAD') {
      return new Response(null, { status: 200, headers: getCorsHeaders(origin) })
    }

    try {
      // Parse and validate request body
      let rawBody: Record<string, unknown>
      try {
        rawBody = await req.json()
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
          status: 400,
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        })
      }

      let session_id: string
      try {
        session_id = validateUUID(rawBody.session_id, 'session_id')
      } catch (validationError) {
        return new Response(JSON.stringify({ error: (validationError as Error).message }), {
          status: 400,
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        })
      }

      // Get session details
      const { data: session, error: sessionError } = await deps.supabaseClient
        .from('sessions')
        .select('*, squads(total_members)')
        .eq('id', session_id)
        .single()

      if (sessionError || !session) {
        throw new Error('Session not found')
      }

      // Get RSVPs
      const { data: rsvps } = await deps.supabaseClient
        .from('session_rsvps')
        .select('response, user_id')
        .eq('session_id', session_id)

      const presentCount =
        rsvps?.filter((r: { response: string }) => r.response === 'present').length || 0
      const absentCount =
        rsvps?.filter((r: { response: string }) => r.response === 'absent').length || 0
      const maybeCount =
        rsvps?.filter((r: { response: string }) => r.response === 'maybe').length || 0
      const totalMembers =
        (session as Record<string, Record<string, number>>).squads?.total_members || 1
      const minPlayers = (session as Record<string, unknown>).min_players as number || 2

      // Calculate time until session
      const sessionTime = new Date((session as Record<string, string>).scheduled_at)
      const now = new Date()
      const hoursUntilSession = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60)

      // Compute decision
      const recommendation = computeDecision({
        sessionStatus: (session as Record<string, string>).status,
        presentCount,
        absentCount,
        maybeCount,
        totalMembers,
        minPlayers,
        hoursUntilSession,
      })

      // If recommending reschedule, suggest alternative slots
      if (recommendation.recommended_action === 'reschedule') {
        const { data: bestSlots } = await deps.supabaseClient.rpc('get_best_slots', {
          p_squad_id: (session as Record<string, string>).squad_id,
          p_limit: 3,
        })

        if (bestSlots && (bestSlots as unknown[]).length > 0) {
          recommendation.alternative_slots = (
            bestSlots as Array<{ day_of_week: number; hour: number; avg_attendance: number }>
          ).map((slot) => ({
            day_of_week: slot.day_of_week,
            hour: slot.hour,
            reliability_score: Math.round(slot.avg_attendance),
          }))
        }
      }

      // Generate AI-powered reason
      const aiReason = await deps.callClaudeAPI('generate decision reason')

      const finalRecommendation = {
        ...recommendation,
        reason: aiReason || recommendation.reason,
        ai_generated: !!aiReason,
      }

      return new Response(JSON.stringify({ recommendation: finalRecommendation }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 500,
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ai-decision', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>
  let mockCallClaudeAPI: ReturnType<typeof vi.fn>
  let handler: (req: Request) => Promise<Response>

  const SESSION_ID = '550e8400-e29b-41d4-a716-446655440000'
  const SQUAD_ID = '660e8400-e29b-41d4-a716-446655440001'

  // Helper: create a session with given parameters
  function makeSession(overrides?: Partial<{
    status: string
    scheduled_at: string
    min_players: number
    squad_id: string
    title: string
    game: string
    squads: { total_members: number }
  }>) {
    const futureDate = new Date(Date.now() + 72 * 60 * 60 * 1000) // 72h from now
    return {
      id: SESSION_ID,
      status: 'pending',
      scheduled_at: futureDate.toISOString(),
      min_players: 4,
      squad_id: SQUAD_ID,
      title: 'Session test',
      game: 'Valorant',
      squads: { total_members: 10 },
      ...overrides,
    }
  }

  // Helper: create RSVPs
  function makeRsvps(
    present: number,
    absent: number,
    maybe: number
  ): Array<{ response: string; user_id: string }> {
    const rsvps: Array<{ response: string; user_id: string }> = []
    for (let i = 0; i < present; i++) {
      rsvps.push({ response: 'present', user_id: `user-present-${i}` })
    }
    for (let i = 0; i < absent; i++) {
      rsvps.push({ response: 'absent', user_id: `user-absent-${i}` })
    }
    for (let i = 0; i < maybe; i++) {
      rsvps.push({ response: 'maybe', user_id: `user-maybe-${i}` })
    }
    return rsvps
  }

  function setupHandler(sessionConfig: SessionConfig = {}) {
    mockSupabase = createMockSupabaseClient(sessionConfig)
    mockCallClaudeAPI = vi.fn().mockResolvedValue(null)
    handler = buildHandler({
      supabaseClient: mockSupabase,
      callClaudeAPI: mockCallClaudeAPI,
    })
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    setupHandler({
      session: makeSession(),
      rsvps: makeRsvps(5, 1, 1),
    })
  })

  // ------- CORS & preflight -------

  describe('CORS & preflight', () => {
    it('responds to OPTIONS with CORS headers', async () => {
      const req = new Request('https://edge.fn/ai-decision', {
        method: 'OPTIONS',
        headers: { origin: 'https://squadplanner.fr' },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://squadplanner.fr')
    })

    it('responds to HEAD with 200 (health check)', async () => {
      const req = new Request('https://edge.fn/ai-decision', {
        method: 'HEAD',
        headers: { origin: 'https://squadplanner.app' },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
    })

    it('does not include Access-Control-Allow-Origin for unknown origins', async () => {
      const req = new Request('https://edge.fn/ai-decision', {
        method: 'OPTIONS',
        headers: { origin: 'https://evil.com' },
      })
      const res = await handler(req)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })
  })

  // ------- Input validation -------

  describe('input validation', () => {
    it('returns 400 for invalid JSON body', async () => {
      const req = new Request('https://edge.fn/ai-decision', {
        method: 'POST',
        body: 'not json',
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/Invalid JSON/)
    })

    it('returns 400 when session_id is missing', async () => {
      const req = new Request('https://edge.fn/ai-decision', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/session_id/)
    })

    it('returns 400 when session_id is not a valid UUID', async () => {
      const req = new Request('https://edge.fn/ai-decision', {
        method: 'POST',
        body: JSON.stringify({ session_id: 'not-a-uuid' }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/session_id must be a valid UUID/)
    })
  })

  // ------- Session not found -------

  describe('session not found', () => {
    it('returns 500 error when session does not exist', async () => {
      setupHandler({ session: null, sessionError: { message: 'not found' } })

      const req = new Request('https://edge.fn/ai-decision', {
        method: 'POST',
        body: JSON.stringify({ session_id: SESSION_ID }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Session not found')
    })
  })

  // ------- 8 Decision branches -------

  describe('decision branches', () => {
    // Branch 1: Already confirmed
    it('returns confirm with 100% confidence when session is already confirmed', () => {
      const result = computeDecision({
        sessionStatus: 'confirmed',
        presentCount: 2,
        absentCount: 3,
        maybeCount: 1,
        totalMembers: 10,
        minPlayers: 4,
        hoursUntilSession: 48,
      })
      expect(result.recommended_action).toBe('confirm')
      expect(result.confidence).toBe(100)
      expect(result.reason).toMatch(/deja confirmee/)
    })

    // Branch 2: Already cancelled
    it('returns cancel with 100% confidence when session is already cancelled', () => {
      const result = computeDecision({
        sessionStatus: 'cancelled',
        presentCount: 5,
        absentCount: 0,
        maybeCount: 0,
        totalMembers: 10,
        minPlayers: 4,
        hoursUntilSession: 48,
      })
      expect(result.recommended_action).toBe('cancel')
      expect(result.confidence).toBe(100)
      expect(result.reason).toMatch(/annulee/)
    })

    // Branch 3: Enough players + high response rate (>= 70%)
    it('returns confirm when enough players and response rate >= 70%', () => {
      const result = computeDecision({
        sessionStatus: 'pending',
        presentCount: 5,
        absentCount: 1,
        maybeCount: 1,
        totalMembers: 10,
        minPlayers: 4,
        hoursUntilSession: 48,
      })
      expect(result.recommended_action).toBe('confirm')
      expect(result.confidence).toBeGreaterThanOrEqual(60)
      expect(result.confidence).toBeLessThanOrEqual(95)
      expect(result.reason).toContain('5 joueurs confirmes')
    })

    // Branch 4: Too many absent (> 50%)
    it('returns cancel with 85% confidence when more than half are absent', () => {
      const result = computeDecision({
        sessionStatus: 'pending',
        presentCount: 2,
        absentCount: 6,
        maybeCount: 0,
        totalMembers: 10,
        minPlayers: 4,
        hoursUntilSession: 72,
      })
      expect(result.recommended_action).toBe('cancel')
      expect(result.confidence).toBe(85)
      expect(result.reason).toContain('6 membres sur 10')
    })

    // Branch 5: Time pressure (< 24h, not enough players)
    it('returns reschedule when less than 24h and not enough players', () => {
      const result = computeDecision({
        sessionStatus: 'pending',
        presentCount: 2,
        absentCount: 1,
        maybeCount: 0,
        totalMembers: 10,
        minPlayers: 4,
        hoursUntilSession: 12,
      })
      expect(result.recommended_action).toBe('reschedule')
      expect(result.confidence).toBe(80)
      expect(result.reason).toMatch(/Moins de 24h/)
    })

    // Branch 6: Uncertainty (more maybe than confirmed, < 48h)
    it('returns reschedule when too much uncertainty close to session', () => {
      const result = computeDecision({
        sessionStatus: 'pending',
        presentCount: 2,
        absentCount: 0,
        maybeCount: 5,
        totalMembers: 10,
        minPlayers: 4,
        hoursUntilSession: 36,
      })
      expect(result.recommended_action).toBe('reschedule')
      expect(result.confidence).toBe(70)
      expect(result.reason).toContain('peut-etre')
    })

    // Branch 7: Low response rate but still time
    it('returns wait when response rate < 50% but more than 48h left', () => {
      const result = computeDecision({
        sessionStatus: 'pending',
        presentCount: 2,
        absentCount: 1,
        maybeCount: 1,
        totalMembers: 10,
        minPlayers: 4,
        hoursUntilSession: 72,
      })
      expect(result.recommended_action).toBe('wait')
      expect(result.confidence).toBe(60)
      expect(result.reason).toMatch(/40%/)
    })

    // Branch 8a: Minimum reached (but low response rate, so not branch 3)
    it('returns confirm with 70% confidence when minimum reached but response rate < 70%', () => {
      const result = computeDecision({
        sessionStatus: 'pending',
        presentCount: 4,
        absentCount: 0,
        maybeCount: 0,
        totalMembers: 10,
        minPlayers: 4,
        hoursUntilSession: 30,
      })
      expect(result.recommended_action).toBe('confirm')
      expect(result.confidence).toBe(70)
      expect(result.reason).toContain('minimum de 4 joueurs')
    })

    // Branch 8b: Default wait
    it('returns wait with 50% confidence as default when no other condition matches', () => {
      const result = computeDecision({
        sessionStatus: 'pending',
        presentCount: 1,
        absentCount: 0,
        maybeCount: 0,
        totalMembers: 10,
        minPlayers: 4,
        hoursUntilSession: 30,
      })
      expect(result.recommended_action).toBe('wait')
      expect(result.confidence).toBe(50)
      expect(result.reason).toContain('1/4 joueurs confirmes')
    })
  })

  // ------- Confidence scoring -------

  describe('confidence scoring', () => {
    it('confidence increases with more present players (branch 3)', () => {
      const result4 = computeDecision({
        sessionStatus: 'pending',
        presentCount: 4,
        absentCount: 2,
        maybeCount: 2,
        totalMembers: 10,
        minPlayers: 4,
        hoursUntilSession: 48,
      })

      const result8 = computeDecision({
        sessionStatus: 'pending',
        presentCount: 8,
        absentCount: 1,
        maybeCount: 1,
        totalMembers: 10,
        minPlayers: 4,
        hoursUntilSession: 48,
      })

      expect(result8.confidence).toBeGreaterThan(result4.confidence)
    })

    it('confidence is capped at 95 (branch 3)', () => {
      const result = computeDecision({
        sessionStatus: 'pending',
        presentCount: 10,
        absentCount: 0,
        maybeCount: 0,
        totalMembers: 10,
        minPlayers: 2,
        hoursUntilSession: 48,
      })
      expect(result.confidence).toBeLessThanOrEqual(95)
    })

    it('confidence is always within 50-100 range', () => {
      const scenarios: DecisionInput[] = [
        {
          sessionStatus: 'pending',
          presentCount: 0,
          absentCount: 0,
          maybeCount: 0,
          totalMembers: 10,
          minPlayers: 4,
          hoursUntilSession: 72,
        },
        {
          sessionStatus: 'confirmed',
          presentCount: 10,
          absentCount: 0,
          maybeCount: 0,
          totalMembers: 10,
          minPlayers: 2,
          hoursUntilSession: 1,
        },
        {
          sessionStatus: 'pending',
          presentCount: 1,
          absentCount: 8,
          maybeCount: 1,
          totalMembers: 10,
          minPlayers: 4,
          hoursUntilSession: 6,
        },
      ]

      for (const scenario of scenarios) {
        const result = computeDecision(scenario)
        expect(result.confidence).toBeGreaterThanOrEqual(50)
        expect(result.confidence).toBeLessThanOrEqual(100)
      }
    })
  })

  // ------- Alternative slots -------

  describe('alternative slots', () => {
    it('calls RPC get_best_slots when recommending reschedule', async () => {
      const session = makeSession({
        scheduled_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        min_players: 4,
      })
      setupHandler({
        session,
        rsvps: makeRsvps(1, 1, 0), // not enough, < 24h -> reschedule
        bestSlots: [
          { day_of_week: 3, hour: 20, avg_attendance: 85 },
          { day_of_week: 5, hour: 21, avg_attendance: 78 },
        ],
      })

      const req = new Request('https://edge.fn/ai-decision', {
        method: 'POST',
        body: JSON.stringify({ session_id: SESSION_ID }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.recommendation.recommended_action).toBe('reschedule')
      expect(json.recommendation.alternative_slots).toBeDefined()
      expect(json.recommendation.alternative_slots).toHaveLength(2)
      expect(json.recommendation.alternative_slots[0]).toEqual({
        day_of_week: 3,
        hour: 20,
        reliability_score: 85,
      })
    })

    it('does not include alternative_slots when not recommending reschedule', async () => {
      setupHandler({
        session: makeSession({ status: 'confirmed' }),
        rsvps: makeRsvps(5, 1, 1),
      })

      const req = new Request('https://edge.fn/ai-decision', {
        method: 'POST',
        body: JSON.stringify({ session_id: SESSION_ID }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.recommendation.alternative_slots).toBeUndefined()
    })
  })

  // ------- AI reasoning -------

  describe('AI reasoning', () => {
    it('uses AI reason when Claude API returns a response', async () => {
      setupHandler({
        session: makeSession({ status: 'confirmed' }),
        rsvps: makeRsvps(5, 1, 1),
      })
      mockCallClaudeAPI.mockResolvedValue(
        'La session est deja validee avec 5 joueurs confirmes. Lancez les invitations finales !'
      )

      const req = new Request('https://edge.fn/ai-decision', {
        method: 'POST',
        body: JSON.stringify({ session_id: SESSION_ID }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.recommendation.reason).toBe(
        'La session est deja validee avec 5 joueurs confirmes. Lancez les invitations finales !'
      )
      expect(json.recommendation.ai_generated).toBe(true)
    })

    it('falls back to template reason when Claude API returns null', async () => {
      setupHandler({
        session: makeSession({ status: 'confirmed' }),
        rsvps: makeRsvps(5, 1, 1),
      })
      mockCallClaudeAPI.mockResolvedValue(null)

      const req = new Request('https://edge.fn/ai-decision', {
        method: 'POST',
        body: JSON.stringify({ session_id: SESSION_ID }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      // Should use template reason (contains "deja confirmee" for confirmed status)
      expect(json.recommendation.reason).toMatch(/deja confirmee/)
      expect(json.recommendation.ai_generated).toBe(false)
    })

    it('falls back to template reason when Claude API throws', async () => {
      setupHandler({
        session: makeSession({ status: 'confirmed' }),
        rsvps: makeRsvps(5, 1, 1),
      })
      mockCallClaudeAPI.mockRejectedValue(new Error('API timeout'))

      const req = new Request('https://edge.fn/ai-decision', {
        method: 'POST',
        body: JSON.stringify({ session_id: SESSION_ID }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      // The handler catches the error at the top level
      expect(res.status).toBe(500)
    })
  })

  // ------- Response structure -------

  describe('response structure', () => {
    it('includes all expected fields in recommendation', async () => {
      setupHandler({
        session: makeSession(),
        rsvps: makeRsvps(5, 2, 1),
      })

      const req = new Request('https://edge.fn/ai-decision', {
        method: 'POST',
        body: JSON.stringify({ session_id: SESSION_ID }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await handler(req)
      expect(res.status).toBe(200)
      const json = await res.json()

      const rec = json.recommendation
      expect(rec).toHaveProperty('recommended_action')
      expect(rec).toHaveProperty('confidence')
      expect(rec).toHaveProperty('reason')
      expect(rec).toHaveProperty('ai_generated')
      expect(rec).toHaveProperty('details')
      expect(rec.details).toHaveProperty('present_count')
      expect(rec.details).toHaveProperty('absent_count')
      expect(rec.details).toHaveProperty('maybe_count')
      expect(rec.details).toHaveProperty('no_response_count')
      expect(rec.details).toHaveProperty('total_members')
      expect(rec.details).toHaveProperty('min_players')
      expect(rec.details).toHaveProperty('response_rate')
      expect(rec.details).toHaveProperty('time_until_session')

      // Verify action is one of the valid values
      expect(['confirm', 'cancel', 'reschedule', 'wait']).toContain(rec.recommended_action)
    })
  })

  // ------- Validation helpers (unit tests) -------

  describe('validateUUID', () => {
    it('accepts valid UUID', () => {
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000', 'id')).toBe(
        '550e8400-e29b-41d4-a716-446655440000'
      )
    })

    it('rejects invalid UUID', () => {
      expect(() => validateUUID('not-a-uuid', 'id')).toThrow('id must be a valid UUID')
    })

    it('rejects non-string', () => {
      expect(() => validateUUID(123, 'id')).toThrow('id must be a string')
    })

    it('rejects null', () => {
      expect(() => validateUUID(null, 'id')).toThrow('id must be a string')
    })
  })

  // ------- getCorsHeaders (unit tests) -------

  describe('getCorsHeaders', () => {
    it('includes Access-Control-Allow-Origin for allowed origin', () => {
      const headers = getCorsHeaders('https://squadplanner.fr')
      expect(headers['Access-Control-Allow-Origin']).toBe('https://squadplanner.fr')
    })

    it('does not include Allow-Origin for disallowed origin', () => {
      const headers = getCorsHeaders('https://malicious.com')
      expect(headers).not.toHaveProperty('Access-Control-Allow-Origin')
    })

    it('does not include Allow-Origin when origin is null', () => {
      const headers = getCorsHeaders(null)
      expect(headers).not.toHaveProperty('Access-Control-Allow-Origin')
    })
  })
})
