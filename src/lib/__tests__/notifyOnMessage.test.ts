import { describe, it, expect, vi, beforeEach } from 'vitest'

// Build Supabase mock chain matching real usage:
// supabase.from('squad_members').select('user_id').eq('squad_id', x).neq('user_id', y)
// supabase.from('squads').select('name').eq('id', x).single()
// supabase.from('notifications').insert({...})
// supabase.functions.invoke('send-push', { body: ... })

const mockInvoke = vi.fn().mockResolvedValue({ data: null, error: null })
const mockInsert = vi.fn().mockReturnValue({ error: null })

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

// Suppress console.warn in tests
vi.stubGlobal('import', { meta: { env: { PROD: true } } })

describe('notifySquadMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: 2 squad members
    mockMembersNeq.mockResolvedValue({
      data: [{ user_id: 'member-1' }, { user_id: 'member-2' }],
    })
    // Default: squad name found
    mockSquadSingle.mockResolvedValue({ data: { name: 'Raid Squad' } })
  })

  it('should query squad members excluding the sender', async () => {
    const { notifySquadMessage } = await import('../notifyOnMessage')
    await notifySquadMessage('squad-1', 'sender-id', 'Alice', 'Hello!')

    expect(mockFrom).toHaveBeenCalledWith('squad_members')
    expect(mockMembersSelect).toHaveBeenCalledWith('user_id')
    expect(mockMembersEqSquad).toHaveBeenCalledWith('squad_id', 'squad-1')
    expect(mockMembersNeq).toHaveBeenCalledWith('user_id', 'sender-id')
  })

  it('should send push to all members with correct payload', async () => {
    const { notifySquadMessage } = await import('../notifyOnMessage')
    await notifySquadMessage('squad-1', 'sender-id', 'Alice', 'Hello everyone!')

    expect(mockInvoke).toHaveBeenCalledWith('send-push', {
      body: {
        userIds: ['member-1', 'member-2'],
        title: 'Alice · Raid Squad',
        body: 'Hello everyone!',
        icon: '/icon-192.svg',
        tag: 'msg-squad-squad-1',
        url: '/messages',
        data: { type: 'new_message', squad_id: 'squad-1', session_id: undefined },
        vibrate: [100, 50, 100],
      },
    })
  })

  it('should append sessionId to tag when provided', async () => {
    const { notifySquadMessage } = await import('../notifyOnMessage')
    await notifySquadMessage('squad-1', 'sender-id', 'Alice', 'GG', 'session-42')

    expect(mockInvoke).toHaveBeenCalledWith('send-push', {
      body: expect.objectContaining({
        tag: 'msg-squad-squad-1-session-42',
        data: expect.objectContaining({ session_id: 'session-42' }),
      }),
    })
  })

  it('should fallback to "Squad" when squad name not found', async () => {
    mockSquadSingle.mockResolvedValue({ data: null })
    const { notifySquadMessage } = await import('../notifyOnMessage')
    await notifySquadMessage('squad-1', 'sender-id', 'Bob', 'Hey')

    expect(mockInvoke).toHaveBeenCalledWith('send-push', {
      body: expect.objectContaining({ title: 'Bob · Squad' }),
    })
  })

  it('should truncate content longer than 80 chars', async () => {
    const { notifySquadMessage } = await import('../notifyOnMessage')
    const longMessage = 'A'.repeat(100)
    await notifySquadMessage('squad-1', 'sender-id', 'Alice', longMessage)

    expect(mockInvoke).toHaveBeenCalledWith('send-push', {
      body: expect.objectContaining({ body: 'A'.repeat(80) + '...' }),
    })
  })

  it('should NOT truncate content at exactly 80 chars', async () => {
    const { notifySquadMessage } = await import('../notifyOnMessage')
    const exact = 'B'.repeat(80)
    await notifySquadMessage('squad-1', 'sender-id', 'Alice', exact)

    expect(mockInvoke).toHaveBeenCalledWith('send-push', {
      body: expect.objectContaining({ body: exact }),
    })
  })

  it('should not send push when no members to notify', async () => {
    mockMembersNeq.mockResolvedValue({ data: [] })
    const { notifySquadMessage } = await import('../notifyOnMessage')
    await notifySquadMessage('squad-1', 'sender-id', 'Alice', 'Hello')

    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('should not send push when members is null', async () => {
    mockMembersNeq.mockResolvedValue({ data: null })
    const { notifySquadMessage } = await import('../notifyOnMessage')
    await notifySquadMessage('squad-1', 'sender-id', 'Alice', 'Hello')

    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('should not throw when push delivery fails (fire-and-forget)', async () => {
    mockInvoke.mockRejectedValue(new Error('Push service down'))
    const { notifySquadMessage } = await import('../notifyOnMessage')

    await expect(
      notifySquadMessage('squad-1', 'sender-id', 'Alice', 'Hello'),
    ).resolves.toBeUndefined()
  })

  it('should not throw when DB query fails', async () => {
    mockMembersNeq.mockRejectedValue(new Error('DB connection lost'))
    const { notifySquadMessage } = await import('../notifyOnMessage')

    await expect(
      notifySquadMessage('squad-1', 'sender-id', 'Alice', 'Hello'),
    ).resolves.toBeUndefined()
  })
})

describe('notifyDirectMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockReturnValue({ error: null })
    mockInvoke.mockResolvedValue({ data: null, error: null })
  })

  it('should insert in-app notification for receiver', async () => {
    const { notifyDirectMessage } = await import('../notifyOnMessage')
    await notifyDirectMessage('receiver-1', 'sender-1', 'Alice', 'Hey there!')

    expect(mockFrom).toHaveBeenCalledWith('notifications')
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'receiver-1',
      type: 'new_dm',
      title: 'Message de Alice',
      message: 'Hey there!',
      data: { sender_id: 'sender-1', sender_username: 'Alice' },
    })
  })

  it('should send push notification to receiver with correct payload', async () => {
    const { notifyDirectMessage } = await import('../notifyOnMessage')
    await notifyDirectMessage('receiver-1', 'sender-1', 'Alice', 'Hey!')

    expect(mockInvoke).toHaveBeenCalledWith('send-push', {
      body: {
        userId: 'receiver-1',
        title: 'Alice',
        body: 'Hey!',
        icon: '/icon-192.svg',
        tag: 'dm-sender-1',
        url: '/messages',
        data: { type: 'new_dm', sender_id: 'sender-1' },
        vibrate: [100, 50, 100],
      },
    })
  })

  it('should truncate long DM content at 80 chars', async () => {
    const { notifyDirectMessage } = await import('../notifyOnMessage')
    const longMsg = 'X'.repeat(120)
    await notifyDirectMessage('receiver-1', 'sender-1', 'Alice', longMsg)

    const expected = 'X'.repeat(80) + '...'
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ message: expected }))
    expect(mockInvoke).toHaveBeenCalledWith('send-push', {
      body: expect.objectContaining({ body: expected }),
    })
  })

  it('should not throw when push fails (fire-and-forget)', async () => {
    mockInvoke.mockRejectedValue(new Error('Push failed'))
    const { notifyDirectMessage } = await import('../notifyOnMessage')

    await expect(
      notifyDirectMessage('receiver-1', 'sender-1', 'Alice', 'Hello'),
    ).resolves.toBeUndefined()
  })

  it('should not throw when notification insert fails', async () => {
    mockInsert.mockImplementation(() => { throw new Error('Insert failed') })
    const { notifyDirectMessage } = await import('../notifyOnMessage')

    await expect(
      notifyDirectMessage('receiver-1', 'sender-1', 'Alice', 'Hello'),
    ).resolves.toBeUndefined()
  })
})
