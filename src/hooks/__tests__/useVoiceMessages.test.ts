import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

const { mockSupabase, mockFrom } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockUpload = vi.fn()
  const mockGetPublicUrl = vi.fn()
  const mockStorageFrom = vi.fn().mockReturnValue({
    upload: mockUpload,
    getPublicUrl: mockGetPublicUrl,
  })
  const mockGetSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
  const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@test.com' } } })
  const mockSupabase = {
    auth: { getSession: mockGetSession, getUser: mockGetUser },
    rpc: vi.fn(),
    from: mockFrom,
    storage: { from: mockStorageFrom },
    functions: { invoke: vi.fn() },
  }
  return { mockSupabase, mockFrom, mockUpload, mockGetPublicUrl, mockStorageFrom }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: vi.fn().mockReturnValue(true),
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('../useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: null }),
    {
      getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: null }),
    }
  ),
}))

vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

import { useVoiceMessages, isVoiceMessage, extractVoiceDuration } from '../useVoiceMessages'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('isVoiceMessage', () => {
  it('returns true for message with voice_url', () => {
    expect(isVoiceMessage({ voice_url: 'https://example.com/voice.webm' })).toBe(true)
  })

  it('returns true for message_type voice', () => {
    expect(isVoiceMessage({ message_type: 'voice' })).toBe(true)
  })

  it('returns true for content starting with voice emoji', () => {
    expect(isVoiceMessage({ content: '🎤 Message vocal (1:30)' })).toBe(true)
  })

  it('returns false for regular message', () => {
    expect(
      isVoiceMessage({
        voice_url: null,
        message_type: 'text',
        content: 'Hello world',
      })
    ).toBe(false)
  })
})

describe('extractVoiceDuration', () => {
  it('extracts duration from "(1:30)" -> 90', () => {
    expect(extractVoiceDuration('🎤 Message vocal (1:30)')).toBe(90)
  })

  it('extracts duration from "(0:05)" -> 5', () => {
    expect(extractVoiceDuration('🎤 Message vocal (0:05)')).toBe(5)
  })

  it('returns null for no match', () => {
    expect(extractVoiceDuration('Hello world')).toBeNull()
  })
})

describe('useVoiceMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sendVoiceMessage uploads audio and inserts squad message', async () => {
    // Mock storage upload success
    const mockStorageInstance = {
      upload: vi.fn().mockResolvedValue({
        data: { path: 'user-1/12345.webm' },
        error: null,
      }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/voice-messages/user-1/12345.webm' },
      }),
    }
    mockSupabase.storage.from.mockReturnValue(mockStorageInstance)

    // Mock message insert
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })

    const { result } = renderHook(() => useVoiceMessages(), { wrapper: createWrapper() })

    const blob = new Blob(['audio-data'], { type: 'audio/webm' })

    await act(async () => {
      await result.current.sendVoiceMessage({
        audioBlob: blob,
        duration: 90,
        squadId: 'squad-1',
        sessionId: 'session-1',
      })
    })

    // Verify storage upload was called
    expect(mockSupabase.storage.from).toHaveBeenCalledWith('voice-messages')
    expect(mockStorageInstance.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^user-1\/\d+\.webm$/),
      blob,
      expect.objectContaining({ contentType: 'audio/webm' })
    )

    // Verify message insert was called with correct data
    expect(mockFrom).toHaveBeenCalledWith('messages')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        content: '🎤 Message vocal (1:30)',
        sender_id: 'user-1',
        squad_id: 'squad-1',
        session_id: 'session-1',
        voice_url: 'https://storage.example.com/voice-messages/user-1/12345.webm',
        voice_duration_seconds: 90,
        message_type: 'voice',
        read_by: ['user-1'],
      })
    )
  })
})
