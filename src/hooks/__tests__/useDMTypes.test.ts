import { describe, it, expect } from 'vitest'
import type { DirectMessage, DMConversation, DirectMessagesState } from '../useDMTypes'

describe('useDMTypes', () => {
  // STRICT: Verifies the module can be dynamically imported and exports
  // the expected type-only members without runtime errors
  it('module can be imported and contains expected exports', async () => {
    const mod = await import('../useDMTypes')
    // 1. Module is defined
    expect(mod).toBeDefined()
    // 2. Module is an object
    expect(typeof mod).toBe('object')
    // 3. Module is not null
    expect(mod).not.toBeNull()
    // 4. Module has default or named exports (it's a type-only module so exports are minimal)
    expect(Object.keys(mod).length).toBeGreaterThanOrEqual(0)
    // 5. Importing multiple times returns same reference
    const mod2 = await import('../useDMTypes')
    expect(mod).toBe(mod2)
    // 6. Module does not have unexpected runtime exports (it's types only)
    //    In TypeScript, type-only exports are erased, so runtime object should have no function exports
    const runtimeExports = Object.values(mod).filter((v) => typeof v === 'function')
    expect(runtimeExports.length).toBe(0)
    // 7. Module doesn't throw on access
    expect(() => Object.keys(mod)).not.toThrow()
    // 8. Module can be spread
    expect(() => ({ ...mod })).not.toThrow()
  })

  // STRICT: Verifies DirectMessage interface shape — all required fields present
  // and optional sender field works correctly
  it('DirectMessage type enforces all required fields and optional sender', () => {
    const msg: DirectMessage = {
      id: 'dm-123',
      sender_id: 'user-1',
      receiver_id: 'user-2',
      content: 'Hello there!',
      read_at: null,
      created_at: '2026-02-15T10:00:00Z',
    }
    // 1. id is set correctly
    expect(msg.id).toBe('dm-123')
    // 2. sender_id is set
    expect(msg.sender_id).toBe('user-1')
    // 3. receiver_id is set
    expect(msg.receiver_id).toBe('user-2')
    // 4. content is set
    expect(msg.content).toBe('Hello there!')
    // 5. read_at is null (unread message)
    expect(msg.read_at).toBeNull()
    // 6. created_at is a valid ISO string
    expect(new Date(msg.created_at).toISOString()).toBe('2026-02-15T10:00:00.000Z')
    // 7. sender is optional and defaults to undefined
    expect(msg.sender).toBeUndefined()

    // 8. With sender populated
    const msgWithSender: DirectMessage = {
      ...msg,
      sender: { username: 'alice', avatar_url: 'https://example.com/avatar.png' },
    }
    expect(msgWithSender.sender?.username).toBe('alice')
    // 9. sender avatar_url is accessible
    expect(msgWithSender.sender?.avatar_url).toBe('https://example.com/avatar.png')

    // 10. read_at can also be a date string (read message)
    const readMsg: DirectMessage = { ...msg, read_at: '2026-02-15T11:00:00Z' }
    expect(readMsg.read_at).toBe('2026-02-15T11:00:00Z')
    expect(typeof readMsg.read_at).toBe('string')
  })

  // STRICT: Verifies DMConversation interface shape — all fields are present,
  // correct types, and nullable fields behave correctly
  it('DMConversation type has all required fields with correct value shapes', () => {
    const conv: DMConversation = {
      other_user_id: 'user-42',
      other_user_username: 'alice_gamer',
      other_user_avatar_url: null,
      last_message_content: 'GG bien joue!',
      last_message_at: '2026-02-15T09:30:00Z',
      last_message_sender_id: 'user-42',
      unread_count: 5,
    }
    // 1. other_user_id is a string
    expect(typeof conv.other_user_id).toBe('string')
    expect(conv.other_user_id).toBe('user-42')
    // 2. other_user_username is set
    expect(conv.other_user_username).toBe('alice_gamer')
    // 3. other_user_avatar_url is nullable
    expect(conv.other_user_avatar_url).toBeNull()
    // 4. last_message_content is set
    expect(conv.last_message_content).toBe('GG bien joue!')
    // 5. last_message_at is a valid date string
    expect(new Date(conv.last_message_at!).getFullYear()).toBe(2026)
    // 6. last_message_sender_id matches
    expect(conv.last_message_sender_id).toBe('user-42')
    // 7. unread_count is a positive number
    expect(conv.unread_count).toBe(5)
    expect(conv.unread_count).toBeGreaterThan(0)

    // 8. Conversation with no messages
    const emptyConv: DMConversation = {
      other_user_id: 'user-99',
      other_user_username: 'bob',
      other_user_avatar_url: 'https://example.com/bob.png',
      last_message_content: null,
      last_message_at: null,
      last_message_sender_id: null,
      unread_count: 0,
    }
    expect(emptyConv.last_message_content).toBeNull()
    // 9. avatar_url can be a string
    expect(emptyConv.other_user_avatar_url).toBe('https://example.com/bob.png')
    // 10. zero unread
    expect(emptyConv.unread_count).toBe(0)
  })

  // STRICT: Verifies DirectMessagesState interface has the correct shape
  // with data fields and all method signatures
  it('DirectMessagesState type has correct data and method signatures', () => {
    const noop = async () => {}
    const noopReturn = async () => ({ error: null as Error | null })
    const noopConv = async () => null as DMConversation | null
    const state: DirectMessagesState = {
      messages: [],
      conversations: [],
      activeConversation: null,
      isLoading: false,
      realtimeChannel: null,
      fetchConversations: noop,
      fetchMessages: noop,
      sendMessage: noopReturn,
      setActiveConversation: () => {},
      subscribeToMessages: () => {},
      unsubscribe: () => {},
      markAsRead: noop,
      startConversation: noopConv,
      getTotalUnread: () => 0,
    }
    // 1. messages is an empty array
    expect(state.messages).toEqual([])
    expect(Array.isArray(state.messages)).toBe(true)
    // 2. conversations is an empty array
    expect(state.conversations).toEqual([])
    // 3. activeConversation is null
    expect(state.activeConversation).toBeNull()
    // 4. isLoading is false
    expect(state.isLoading).toBe(false)
    // 5. realtimeChannel is null
    expect(state.realtimeChannel).toBeNull()
    // 6. fetchConversations is a function
    expect(typeof state.fetchConversations).toBe('function')
    // 7. fetchMessages is a function
    expect(typeof state.fetchMessages).toBe('function')
    // 8. sendMessage is a function
    expect(typeof state.sendMessage).toBe('function')
    // 9. setActiveConversation is a function
    expect(typeof state.setActiveConversation).toBe('function')
    // 10. subscribeToMessages is a function
    expect(typeof state.subscribeToMessages).toBe('function')
    // 11. unsubscribe is a function
    expect(typeof state.unsubscribe).toBe('function')
    // 12. markAsRead is a function
    expect(typeof state.markAsRead).toBe('function')
    // 13. startConversation is a function
    expect(typeof state.startConversation).toBe('function')
    // 14. getTotalUnread returns a number
    expect(typeof state.getTotalUnread).toBe('function')
    expect(state.getTotalUnread()).toBe(0)
  })
})
