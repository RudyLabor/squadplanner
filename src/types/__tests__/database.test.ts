import { describe, it, expect } from 'vitest'
import type {
  Json,
  SquadRole,
  SessionStatus,
  RsvpResponse,
  CheckinStatus,
  SubscriptionTier,
  MessageType,
  ChannelType,
  StoryContentType,
  Database,
  Profile,
  Squad,
  SquadMember,
  Session,
  SessionRsvp,
  SessionCheckin,
  Message,
  AIInsight,
  Subscription,
  DirectMessage,
  MessageReaction,
  PublicSquadResult,
  GlobalLeaderboardEntry,
  MatchmakingPlayer,
  MatchmakingRequest,
  UserIntegration,
  SquadChannel,
  Story,
  StoryView,
  FeedStory,
  NotificationPreferences,
  MessageSearchResult,
  DMSearchResult,
} from '../database'

describe('database types', () => {
  it('module can be imported', async () => {
    const mod = await import('../database')
    expect(mod).toBeDefined()
  })

  it('enum types are usable', () => {
    const role: SquadRole = 'leader'
    const status: SessionStatus = 'proposed'
    const rsvp: RsvpResponse = 'present'
    const checkin: CheckinStatus = 'present'
    const tier: SubscriptionTier = 'free'
    const msgType: MessageType = 'text'
    const chType: ChannelType = 'text'
    const storyType: StoryContentType = 'text'

    expect(role).toBe('leader')
    expect(status).toBe('proposed')
    expect(rsvp).toBe('present')
    expect(checkin).toBe('present')
    expect(tier).toBe('free')
    expect(msgType).toBe('text')
    expect(chType).toBe('text')
    expect(storyType).toBe('text')
  })

  it('Profile type is usable', () => {
    const profile: Partial<Profile> = {
      id: 'p1',
      username: 'testuser',
      reliability_score: 85,
      xp: 1000,
      level: 5,
    }
    expect(profile.username).toBe('testuser')
  })

  it('Squad type is usable', () => {
    const squad: Partial<Squad> = {
      id: 's1',
      name: 'Test Squad',
      game: 'Valorant',
      invite_code: 'ABC123',
    }
    expect(squad.name).toBe('Test Squad')
  })

  it('Session type is usable', () => {
    const session: Partial<Session> = {
      id: 'sess1',
      squad_id: 's1',
      status: 'proposed',
      min_players: 3,
    }
    expect(session.status).toBe('proposed')
  })

  it('Message type is usable', () => {
    const msg: Partial<Message> = {
      id: 'm1',
      content: 'Hello',
      message_type: 'text',
      is_pinned: false,
    }
    expect(msg.message_type).toBe('text')
  })

  it('PublicSquadResult type is usable', () => {
    const result: PublicSquadResult = {
      id: 's1',
      name: 'Public Squad',
      description: null,
      game: 'Valorant',
      region: 'EU',
      member_count: 5,
      avg_reliability: 90,
      owner_username: 'owner',
      owner_avatar: null,
      tags: ['competitive'],
      invite_code: 'XYZ',
      created_at: '2026-01-01',
    }
    expect(result.name).toBe('Public Squad')
  })

  it('GlobalLeaderboardEntry type is usable', () => {
    const entry: GlobalLeaderboardEntry = {
      rank: 1,
      user_id: 'u1',
      username: 'top',
      avatar_url: null,
      xp: 5000,
      level: 25,
      reliability_score: 95,
      streak_days: 30,
      total_sessions: 100,
      region: 'EU',
    }
    expect(entry.rank).toBe(1)
  })

  it('SquadChannel type is usable', () => {
    const channel: SquadChannel = {
      id: 'ch1',
      squad_id: 's1',
      name: 'general',
      description: null,
      channel_type: 'text',
      is_default: true,
      position: 0,
      created_by: 'u1',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    }
    expect(channel.name).toBe('general')
  })

  it('Story type is usable', () => {
    const story: Story = {
      id: 'st1',
      user_id: 'u1',
      squad_id: null,
      content_type: 'text',
      content: 'My story',
      media_url: null,
      background_color: '#000',
      text_color: '#fff',
      metadata: {},
      view_count: 0,
      expires_at: '2026-01-02',
      created_at: '2026-01-01',
    }
    expect(story.content_type).toBe('text')
  })

  it('Json type accepts various values', () => {
    const str: Json = 'hello'
    const num: Json = 42
    const bool: Json = true
    const nil: Json = null
    const obj: Json = { key: 'value' }
    const arr: Json = [1, 2, 3]

    expect(str).toBe('hello')
    expect(num).toBe(42)
    expect(bool).toBe(true)
    expect(nil).toBeNull()
    expect(obj).toEqual({ key: 'value' })
    expect(arr).toEqual([1, 2, 3])
  })
})
