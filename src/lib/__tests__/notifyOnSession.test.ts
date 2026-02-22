import { describe, it, expect, vi, beforeEach } from 'vitest'

// Build Supabase mock chain matching real usage in notifyOnSession.ts:
// Promise.all([
//   supabase.from('squad_members').select('user_id').eq('squad_id', x).neq('user_id', y),
//   supabase.from('squads').select('name').eq('id', x).single(),
// ])
// supabase.from('notifications').insert([...])
// supabase.functions.invoke('send-push', { body: ... })

const mockInvoke = vi.fn().mockResolvedValue({ data: null, error: null })
const mockInsert = vi.fn().mockResolvedValue({ error: null })

const mockMembersNeq = vi.fn()
const mockMembersEqSquad = vi.fn().mockReturnValue({ neq: mockMembersNeq })
const mockMembersSelect = vi.fn().mockReturnValue({ eq: mockMembersEqSquad })

const mockSquadSingle = vi.fn()
const mockSquadEq = vi.fn().mockReturnValue({ single: mockSquadSingle })
const mockSquadSelect = vi.fn().mockReturnValue({ eq: mockSquadEq })

const mockFrom = vi.fn().mockImplementation((table: string) => {
  if (table === 'squad_members') return { select: mockMembersSelect }
  if (table === 'squads') return { select: mockSquadSelect }
  if (table === 'notifications') return { insert: mockInsert }
  return {}
})

vi.mock('../supabaseMinimal', () => ({
  supabaseMinimal: {
    from: mockFrom,
    functions: { invoke: mockInvoke },
  },
}))

describe('generateGoogleCalendarUrl', () => {
  it('should generate a valid Google Calendar URL', async () => {
    const { generateGoogleCalendarUrl } = await import('../notifyOnSession')

    const url = generateGoogleCalendarUrl({
      title: 'Raid Night',
      scheduledAt: '2026-03-15T20:00:00Z',
      durationMinutes: 120,
      game: 'Valorant',
      squadName: 'Raid Squad',
    })

    expect(url).toContain('https://calendar.google.com/calendar/render')
    expect(url).toContain('action=TEMPLATE')
    expect(url).toContain('location=SquadPlanner')
  })

  it('should include game in title when provided', async () => {
    const { generateGoogleCalendarUrl } = await import('../notifyOnSession')

    const url = generateGoogleCalendarUrl({
      title: 'Raid Night',
      scheduledAt: '2026-03-15T20:00:00Z',
      durationMinutes: 60,
      game: 'Valorant',
    })

    // URLSearchParams encodes spaces as + in query strings
    expect(url).toContain('Raid+Night')
    expect(url).toContain('Valorant')
    expect(url).toContain('%28Valorant%29') // parentheses are encoded
  })

  it('should NOT include game when undefined', async () => {
    const { generateGoogleCalendarUrl } = await import('../notifyOnSession')

    const url = generateGoogleCalendarUrl({
      title: 'Simple Session',
      scheduledAt: '2026-06-01T10:00:00Z',
      durationMinutes: 60,
    })

    expect(url).toContain('Simple+Session')
    expect(url).not.toContain('%28') // no parentheses = no game
  })

  it('should format dates in Google Calendar format (no dashes/colons)', async () => {
    const { generateGoogleCalendarUrl } = await import('../notifyOnSession')

    const url = generateGoogleCalendarUrl({
      title: 'Test',
      scheduledAt: '2026-03-15T20:00:00Z',
      durationMinutes: 60,
    })

    // Start: 20260315T200000Z / End: 20260315T210000Z
    expect(url).toContain('20260315T200000Z')
    expect(url).toContain('20260315T210000Z')
  })

  it('should compute end date correctly across midnight', async () => {
    const { generateGoogleCalendarUrl } = await import('../notifyOnSession')

    const url = generateGoogleCalendarUrl({
      title: 'Late Night',
      scheduledAt: '2026-12-31T23:00:00Z',
      durationMinutes: 120,
    })

    // 23:00 + 2h = 01:00 next day
    expect(url).toContain('20270101T010000Z')
  })

  it('should include squad name in details when provided', async () => {
    const { generateGoogleCalendarUrl } = await import('../notifyOnSession')

    const url = generateGoogleCalendarUrl({
      title: 'Test',
      scheduledAt: '2026-06-01T10:00:00Z',
      durationMinutes: 60,
      squadName: 'My Squad',
    })

    // URLSearchParams encodes spaces as +
    expect(url).toContain('My+Squad')
  })

  it('should NOT include squad separator when squadName is undefined', async () => {
    const { generateGoogleCalendarUrl } = await import('../notifyOnSession')

    const url = generateGoogleCalendarUrl({
      title: 'Test',
      scheduledAt: '2026-06-01T10:00:00Z',
      durationMinutes: 60,
    })

    const decoded = decodeURIComponent(url)
    expect(decoded).not.toContain(' — ')
  })
})

describe('generateIcsContent', () => {
  it('should generate valid iCalendar format', async () => {
    const { generateIcsContent } = await import('../notifyOnSession')

    const ics = generateIcsContent({
      title: 'Raid Night',
      scheduledAt: '2026-03-15T20:00:00Z',
      durationMinutes: 120,
      game: 'Valorant',
      sessionId: 'session-1',
    })

    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('END:VEVENT')
    expect(ics).toContain('VERSION:2.0')
    expect(ics).toContain('PRODID:-//SquadPlanner//Session//FR')
  })

  it('should include session ID in UID', async () => {
    const { generateIcsContent } = await import('../notifyOnSession')

    const ics = generateIcsContent({
      title: 'Test',
      scheduledAt: '2026-06-01T10:00:00Z',
      durationMinutes: 60,
      sessionId: 'abc-123',
    })

    expect(ics).toContain('UID:session-abc-123@squadplanner.fr')
  })

  it('should format dates correctly in iCal format', async () => {
    const { generateIcsContent } = await import('../notifyOnSession')

    const ics = generateIcsContent({
      title: 'Test',
      scheduledAt: '2026-03-15T20:00:00Z',
      durationMinutes: 120,
      sessionId: 'test-1',
    })

    expect(ics).toContain('DTSTART:20260315T200000Z')
    expect(ics).toContain('DTEND:20260315T220000Z')
  })

  it('should include game in SUMMARY when provided', async () => {
    const { generateIcsContent } = await import('../notifyOnSession')

    const ics = generateIcsContent({
      title: 'Raid Night',
      scheduledAt: '2026-03-15T20:00:00Z',
      durationMinutes: 60,
      game: 'Valorant',
      sessionId: 'test-1',
    })

    expect(ics).toContain('SUMMARY:Raid Night (Valorant)')
  })

  it('should NOT include game in SUMMARY when undefined', async () => {
    const { generateIcsContent } = await import('../notifyOnSession')

    const ics = generateIcsContent({
      title: 'Simple Session',
      scheduledAt: '2026-06-01T10:00:00Z',
      durationMinutes: 60,
      sessionId: 'test-2',
    })

    expect(ics).toContain('SUMMARY:Simple Session')
    expect(ics).not.toContain('(')
  })

  it('should use CRLF line endings as per iCal spec', async () => {
    const { generateIcsContent } = await import('../notifyOnSession')

    const ics = generateIcsContent({
      title: 'Test',
      scheduledAt: '2026-06-01T10:00:00Z',
      durationMinutes: 60,
      sessionId: 'test-3',
    })

    expect(ics).toContain('\r\n')
    const lines = ics.split('\r\n')
    expect(lines[0]).toBe('BEGIN:VCALENDAR')
    expect(lines[lines.length - 1]).toBe('END:VCALENDAR')
  })

  it('should include required iCal fields', async () => {
    const { generateIcsContent } = await import('../notifyOnSession')

    const ics = generateIcsContent({
      title: 'Test',
      scheduledAt: '2026-06-01T10:00:00Z',
      durationMinutes: 60,
      sessionId: 'test-4',
    })

    expect(ics).toContain('STATUS:TENTATIVE')
    expect(ics).toContain('LOCATION:SquadPlanner')
    expect(ics).toContain('DESCRIPTION:Session SquadPlanner')
  })

  it('should handle midnight-crossing durations', async () => {
    const { generateIcsContent } = await import('../notifyOnSession')

    const ics = generateIcsContent({
      title: 'Late Night',
      scheduledAt: '2026-12-31T23:30:00Z',
      durationMinutes: 90,
      sessionId: 'test-5',
    })

    expect(ics).toContain('DTSTART:20261231T233000Z')
    expect(ics).toContain('DTEND:20270101T010000Z')
  })
})

describe('notifySessionCreated', () => {
  const baseData = {
    sessionId: 'session-1',
    squadId: 'squad-1',
    creatorId: 'creator-id',
    creatorUsername: 'Alice',
    title: 'Raid Night',
    game: 'Valorant',
    scheduledAt: '2026-03-15T20:00:00Z',
    durationMinutes: 120,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockMembersNeq.mockResolvedValue({
      data: [{ user_id: 'member-1' }, { user_id: 'member-2' }],
    })
    mockSquadSingle.mockResolvedValue({ data: { name: 'Raid Squad' } })
    mockInsert.mockResolvedValue({ error: null })
    mockInvoke.mockResolvedValue({ data: null, error: null })
  })

  it('should query squad members excluding creator via Promise.all', async () => {
    const { notifySessionCreated } = await import('../notifyOnSession')
    await notifySessionCreated(baseData)

    expect(mockFrom).toHaveBeenCalledWith('squad_members')
    expect(mockMembersEqSquad).toHaveBeenCalledWith('squad_id', 'squad-1')
    expect(mockMembersNeq).toHaveBeenCalledWith('user_id', 'creator-id')
    expect(mockFrom).toHaveBeenCalledWith('squads')
    expect(mockSquadEq).toHaveBeenCalledWith('id', 'squad-1')
  })

  it('should insert in-app notifications for each member', async () => {
    const { notifySessionCreated } = await import('../notifyOnSession')
    await notifySessionCreated(baseData)

    expect(mockFrom).toHaveBeenCalledWith('notifications')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: 'member-1',
          type: 'session_created',
          title: 'Nouvelle session !',
        }),
        expect.objectContaining({
          user_id: 'member-2',
          type: 'session_created',
          title: 'Nouvelle session !',
        }),
      ])
    )
  })

  it('should include calendar_url and session data in notifications', async () => {
    const { notifySessionCreated } = await import('../notifyOnSession')
    await notifySessionCreated(baseData)

    const insertedNotifications = mockInsert.mock.calls[0][0]
    expect(insertedNotifications[0].data).toEqual(
      expect.objectContaining({
        session_id: 'session-1',
        squad_id: 'squad-1',
        created_by: 'creator-id',
        scheduled_at: '2026-03-15T20:00:00Z',
        game: 'Valorant',
        calendar_url: expect.stringContaining('calendar.google.com'),
      })
    )
  })

  it('should send push with accept/refuse actions', async () => {
    const { notifySessionCreated } = await import('../notifyOnSession')
    await notifySessionCreated(baseData)

    expect(mockInvoke).toHaveBeenCalledWith('send-push', {
      body: expect.objectContaining({
        userIds: ['member-1', 'member-2'],
        title: 'Nouvelle session — Raid Squad',
        tag: 'session-created-session-1',
        url: '/squad/squad-1',
        icon: '/icon-192.svg',
        actions: [
          { action: 'accept', title: 'Accepter' },
          { action: 'decline', title: 'Refuser' },
        ],
        vibrate: [200, 100, 200],
        requireInteraction: true,
      }),
    })
  })

  it('should include creator username and session title in push body', async () => {
    const { notifySessionCreated } = await import('../notifyOnSession')
    await notifySessionCreated(baseData)

    const pushBody = mockInvoke.mock.calls[0][1].body
    expect(pushBody.body).toContain('Alice')
    expect(pushBody.body).toContain('Raid Night')
  })

  it('should fallback to "Squad" when squad name not found', async () => {
    mockSquadSingle.mockResolvedValue({ data: null })
    const { notifySessionCreated } = await import('../notifyOnSession')
    await notifySessionCreated(baseData)

    expect(mockInvoke).toHaveBeenCalledWith('send-push', {
      body: expect.objectContaining({ title: 'Nouvelle session — Squad' }),
    })
  })

  it('should not send anything when no members to notify', async () => {
    mockMembersNeq.mockResolvedValue({ data: [] })
    const { notifySessionCreated } = await import('../notifyOnSession')
    await notifySessionCreated(baseData)

    expect(mockInsert).not.toHaveBeenCalled()
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('should not send anything when members is null', async () => {
    mockMembersNeq.mockResolvedValue({ data: null })
    const { notifySessionCreated } = await import('../notifyOnSession')
    await notifySessionCreated(baseData)

    expect(mockInsert).not.toHaveBeenCalled()
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('should handle session without game', async () => {
    const { notifySessionCreated } = await import('../notifyOnSession')
    await notifySessionCreated({ ...baseData, game: undefined })

    expect(mockInvoke).toHaveBeenCalled()
    const insertedNotifications = mockInsert.mock.calls[0][0]
    expect(insertedNotifications[0].data.game).toBeUndefined()
  })

  it('should not throw when push delivery fails (fire-and-forget)', async () => {
    mockInvoke.mockRejectedValue(new Error('Push service down'))
    const { notifySessionCreated } = await import('../notifyOnSession')

    await expect(notifySessionCreated(baseData)).resolves.toBeUndefined()
  })

  it('should not throw when notification insert fails', async () => {
    mockInsert.mockRejectedValue(new Error('DB write failed'))
    const { notifySessionCreated } = await import('../notifyOnSession')

    await expect(notifySessionCreated(baseData)).resolves.toBeUndefined()
  })

  it('should not throw when DB query fails', async () => {
    mockMembersNeq.mockRejectedValue(new Error('Network error'))
    const { notifySessionCreated } = await import('../notifyOnSession')

    await expect(notifySessionCreated(baseData)).resolves.toBeUndefined()
  })
})
