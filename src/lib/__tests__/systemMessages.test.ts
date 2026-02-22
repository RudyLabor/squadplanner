import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabaseMinimal
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })
const mockGetUser = vi.fn()

vi.mock('../supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  },
  supabase: {
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  },
}))

describe('systemMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })
    mockInsert.mockResolvedValue({ error: null })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('sendSystemMessage', () => {
    it('should insert a system message with correct fields', async () => {
      const { sendSystemMessage } = await import('../systemMessages')

      const result = await sendSystemMessage({
        squadId: 'squad-1',
        content: 'Test message',
      })

      expect(mockFrom).toHaveBeenCalledWith('messages')
      expect(mockInsert).toHaveBeenCalledWith({
        content: 'Test message',
        squad_id: 'squad-1',
        sender_id: 'user-123',
        is_system_message: true,
        read_by: [],
      })
      expect(result).toEqual({ error: null })
    })

    it('should include sessionId when provided', async () => {
      const { sendSystemMessage } = await import('../systemMessages')

      await sendSystemMessage({
        squadId: 'squad-1',
        sessionId: 'session-42',
        content: 'Session message',
      })

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: 'session-42',
        })
      )
    })

    it('should not include session_id when sessionId is undefined', async () => {
      const { sendSystemMessage } = await import('../systemMessages')

      await sendSystemMessage({
        squadId: 'squad-1',
        content: 'No session',
      })

      const insertArg = mockInsert.mock.calls[0][0]
      expect(insertArg).not.toHaveProperty('session_id')
    })

    it('should return { error: null } when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      const { sendSystemMessage } = await import('../systemMessages')

      const result = await sendSystemMessage({
        squadId: 'squad-1',
        content: 'Test',
      })

      expect(result).toEqual({ error: null })
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('should log a warning when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      const { sendSystemMessage } = await import('../systemMessages')

      await sendSystemMessage({
        squadId: 'squad-1',
        content: 'Test',
      })

      expect(console.warn).toHaveBeenCalledWith('sendSystemMessage: Not authenticated, skipping')
    })

    it('should return error when insert fails', async () => {
      const dbError = { message: 'Insert failed', code: '42501' }
      mockInsert.mockResolvedValue({ error: dbError })

      const { sendSystemMessage } = await import('../systemMessages')

      const result = await sendSystemMessage({
        squadId: 'squad-1',
        content: 'Test',
      })

      expect(result.error).toBeTruthy()
      expect(console.error).toHaveBeenCalledWith('Erreur envoi message système:', dbError)
    })

    it('should catch and return thrown errors', async () => {
      mockGetUser.mockRejectedValue(new Error('Network error'))

      const { sendSystemMessage } = await import('../systemMessages')

      const result = await sendSystemMessage({
        squadId: 'squad-1',
        content: 'Test',
      })

      expect(result.error).toBeInstanceOf(Error)
      expect((result.error as Error).message).toBe('Network error')
    })
  })

  describe('sendMemberJoinedMessage', () => {
    it('should send correct message format', async () => {
      const { sendMemberJoinedMessage } = await import('../systemMessages')

      await sendMemberJoinedMessage('squad-1', 'Alice')

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Alice a rejoint la squad',
          squad_id: 'squad-1',
        })
      )
    })

    it('should handle empty username', async () => {
      const { sendMemberJoinedMessage } = await import('../systemMessages')

      await sendMemberJoinedMessage('squad-1', '')

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          content: ' a rejoint la squad',
        })
      )
    })
  })

  describe('sendMemberLeftMessage', () => {
    it('should send correct message format', async () => {
      const { sendMemberLeftMessage } = await import('../systemMessages')

      await sendMemberLeftMessage('squad-1', 'Bob')

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Bob a quitté la squad',
          squad_id: 'squad-1',
        })
      )
    })
  })

  describe('sendSessionConfirmedMessage', () => {
    it('should format date in French locale', async () => {
      const { sendSessionConfirmedMessage } = await import('../systemMessages')

      await sendSessionConfirmedMessage('squad-1', 'Raid Night', '2026-03-15T20:00:00Z')

      // Should contain the session title and a French-formatted date
      const content = mockInsert.mock.calls[0][0].content
      expect(content).toContain('Raid Night confirmée pour')
      // Should contain French date parts (e.g. "dimanche", "mars")
      expect(content).toMatch(/\d/)
    })

    it('should use "Session" as default when sessionTitle is null', async () => {
      const { sendSessionConfirmedMessage } = await import('../systemMessages')

      await sendSessionConfirmedMessage('squad-1', null, '2026-01-01T10:00:00Z')

      const content = mockInsert.mock.calls[0][0].content
      expect(content).toContain('Session confirmée pour')
    })

    it('should include hours and minutes in the formatted date', async () => {
      const { sendSessionConfirmedMessage } = await import('../systemMessages')

      await sendSessionConfirmedMessage('squad-1', 'Test', '2026-06-15T14:30:00Z')

      const content = mockInsert.mock.calls[0][0].content
      // The date format includes hour:2-digit and minute:2-digit
      expect(content).toMatch(/\d{2}:\d{2}/)
    })
  })

  describe('sendRsvpMessage', () => {
    it('should map "present" to "Présent"', async () => {
      const { sendRsvpMessage } = await import('../systemMessages')

      await sendRsvpMessage('squad-1', 'Alice', 'Raid Night', 'present')

      const content = mockInsert.mock.calls[0][0].content
      expect(content).toBe('Alice a répondu Présent pour Raid Night')
    })

    it('should map "absent" to "Absent"', async () => {
      const { sendRsvpMessage } = await import('../systemMessages')

      await sendRsvpMessage('squad-1', 'Bob', 'Arena', 'absent')

      const content = mockInsert.mock.calls[0][0].content
      expect(content).toBe('Bob a répondu Absent pour Arena')
    })

    it('should map "maybe" to "Peut-être"', async () => {
      const { sendRsvpMessage } = await import('../systemMessages')

      await sendRsvpMessage('squad-1', 'Charlie', 'Dungeon', 'maybe')

      const content = mockInsert.mock.calls[0][0].content
      expect(content).toBe('Charlie a répondu Peut-être pour Dungeon')
    })

    it('should use "la session" when sessionTitle is null', async () => {
      const { sendRsvpMessage } = await import('../systemMessages')

      await sendRsvpMessage('squad-1', 'Alice', null, 'present')

      const content = mockInsert.mock.calls[0][0].content
      expect(content).toBe('Alice a répondu Présent pour la session')
    })
  })
})
