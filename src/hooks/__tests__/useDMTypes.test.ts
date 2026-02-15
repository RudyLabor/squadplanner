import { describe, it, expect } from 'vitest'
import type {
  DirectMessage,
  DMConversation,
  DirectMessagesState,
} from '../useDMTypes'

describe('useDMTypes', () => {
  it('module can be imported', async () => {
    const mod = await import('../useDMTypes')
    expect(mod).toBeDefined()
  })

  it('DirectMessage type is usable', () => {
    const msg: DirectMessage = {
      id: 'dm1',
      sender_id: 'u1',
      receiver_id: 'u2',
      content: 'Hello',
      read_at: null,
      created_at: '2026-01-01',
    }
    expect(msg.content).toBe('Hello')
  })

  it('DMConversation type is usable', () => {
    const conv: DMConversation = {
      other_user_id: 'u2',
      other_user_username: 'alice',
      other_user_avatar_url: null,
      last_message_content: 'Hey',
      last_message_at: '2026-01-01',
      last_message_sender_id: 'u1',
      unread_count: 3,
    }
    expect(conv.unread_count).toBe(3)
  })

  it('DirectMessagesState type is structurally valid', () => {
    const partial: Partial<DirectMessagesState> = {
      messages: [],
      conversations: [],
      activeConversation: null,
      isLoading: false,
      realtimeChannel: null,
    }
    expect(partial.isLoading).toBe(false)
  })
})
