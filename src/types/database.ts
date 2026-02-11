export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enum types
export type SquadRole = 'leader' | 'co_leader' | 'member'
export type SessionStatus = 'proposed' | 'confirmed' | 'cancelled' | 'completed'
export type RsvpResponse = 'present' | 'absent' | 'maybe'
export type CheckinStatus = 'present' | 'late' | 'noshow'
export type SubscriptionTier = 'free' | 'premium'
export type MessageType = 'text' | 'image' | 'voice' | 'gif' | 'poll' | 'location' | 'file'
export type ChannelType = 'text' | 'voice' | 'announcements'
export type StoryContentType = 'text' | 'image' | 'achievement' | 'session_highlight'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email: string | null
          avatar_url: string | null
          bio: string | null
          timezone: string | null
          // Reliability metrics
          reliability_score: number
          total_sessions: number
          total_checkins: number
          total_noshow: number
          total_late: number
          // Gamification
          xp: number
          level: number
          // Streak tracking
          streak_days: number
          streak_last_date: string | null
          // Subscription
          subscription_tier: SubscriptionTier
          subscription_expires_at: string | null
          stripe_customer_id: string | null
          // Phase 6: Social Discovery
          region: string | null
          preferred_games: string[]
          looking_for_squad: boolean
          playstyle: string | null
          twitch_username: string | null
          discord_username: string | null
          // Phase 7: Custom Status
          status_text: string | null
          status_emoji: string | null
          status_expires_at: string | null
          // Timestamps
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email?: string | null
          avatar_url?: string | null
          bio?: string | null
          timezone?: string | null
          reliability_score?: number
          total_sessions?: number
          total_checkins?: number
          total_noshow?: number
          total_late?: number
          xp?: number
          level?: number
          streak_days?: number
          streak_last_date?: string | null
          subscription_tier?: SubscriptionTier
          subscription_expires_at?: string | null
          stripe_customer_id?: string | null
          region?: string | null
          preferred_games?: string[]
          looking_for_squad?: boolean
          playstyle?: string | null
          twitch_username?: string | null
          discord_username?: string | null
          status_text?: string | null
          status_emoji?: string | null
          status_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string | null
          avatar_url?: string | null
          bio?: string | null
          timezone?: string | null
          reliability_score?: number
          total_sessions?: number
          total_checkins?: number
          total_noshow?: number
          total_late?: number
          xp?: number
          level?: number
          streak_days?: number
          streak_last_date?: string | null
          subscription_tier?: SubscriptionTier
          subscription_expires_at?: string | null
          stripe_customer_id?: string | null
          region?: string | null
          preferred_games?: string[]
          looking_for_squad?: boolean
          playstyle?: string | null
          twitch_username?: string | null
          discord_username?: string | null
          status_text?: string | null
          status_emoji?: string | null
          status_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      squads: {
        Row: {
          id: string
          name: string
          description: string | null
          game: string
          timezone: string | null
          owner_id: string
          invite_code: string
          is_premium: boolean
          max_members: number
          total_sessions: number
          total_members: number
          avg_reliability_score: number
          // Phase 6: Social Discovery
          is_public: boolean
          tags: string[]
          region: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          game: string
          timezone?: string | null
          owner_id: string
          invite_code: string
          is_premium?: boolean
          max_members?: number
          total_sessions?: number
          total_members?: number
          avg_reliability_score?: number
          is_public?: boolean
          tags?: string[]
          region?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          game?: string
          timezone?: string | null
          owner_id?: string
          invite_code?: string
          is_premium?: boolean
          max_members?: number
          total_sessions?: number
          total_members?: number
          avg_reliability_score?: number
          is_public?: boolean
          tags?: string[]
          region?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      squad_members: {
        Row: {
          id: string
          squad_id: string
          user_id: string
          role: SquadRole
          joined_at: string
        }
        Insert: {
          id?: string
          squad_id: string
          user_id: string
          role?: SquadRole
          joined_at?: string
        }
        Update: {
          id?: string
          squad_id?: string
          user_id?: string
          role?: SquadRole
          joined_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          squad_id: string
          title: string | null
          game: string | null
          description: string | null
          scheduled_at: string
          duration_minutes: number
          status: SessionStatus
          min_players: number
          max_players: number | null
          rsvp_deadline: string | null
          auto_confirm_threshold: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          squad_id: string
          title?: string | null
          game?: string | null
          description?: string | null
          scheduled_at: string
          duration_minutes?: number
          status?: SessionStatus
          min_players?: number
          max_players?: number | null
          rsvp_deadline?: string | null
          auto_confirm_threshold?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          squad_id?: string
          title?: string | null
          game?: string | null
          description?: string | null
          scheduled_at?: string
          duration_minutes?: number
          status?: SessionStatus
          min_players?: number
          max_players?: number | null
          rsvp_deadline?: string | null
          auto_confirm_threshold?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_rsvps: {
        Row: {
          id: string
          session_id: string
          user_id: string
          response: RsvpResponse
          responded_at: string
          previous_response: RsvpResponse | null
          changed_count: number
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          response: RsvpResponse
          responded_at?: string
          previous_response?: RsvpResponse | null
          changed_count?: number
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          response?: RsvpResponse
          responded_at?: string
          previous_response?: RsvpResponse | null
          changed_count?: number
        }
        Relationships: []
      }
      session_checkins: {
        Row: {
          id: string
          session_id: string
          user_id: string
          status: CheckinStatus
          checked_at: string
          minutes_late: number
          note: string | null
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          status: CheckinStatus
          checked_at?: string
          minutes_late?: number
          note?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          status?: CheckinStatus
          checked_at?: string
          minutes_late?: number
          note?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          squad_id: string
          session_id: string | null
          sender_id: string
          content: string
          is_ai_suggestion: boolean
          is_system_message: boolean
          is_pinned: boolean
          read_by: string[]
          edited_at: string | null
          // Phase 7: Channels, Threads, Voice
          channel_id: string | null
          thread_id: string | null
          thread_reply_count: number
          thread_last_reply_at: string | null
          voice_url: string | null
          voice_duration_seconds: number | null
          message_type: MessageType
          reply_to_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          squad_id: string
          session_id?: string | null
          sender_id: string
          content: string
          is_ai_suggestion?: boolean
          is_system_message?: boolean
          is_pinned?: boolean
          read_by?: string[]
          edited_at?: string | null
          channel_id?: string | null
          thread_id?: string | null
          voice_url?: string | null
          voice_duration_seconds?: number | null
          message_type?: MessageType
          reply_to_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          squad_id?: string
          session_id?: string | null
          sender_id?: string
          content?: string
          is_ai_suggestion?: boolean
          is_system_message?: boolean
          is_pinned?: boolean
          read_by?: string[]
          edited_at?: string | null
          channel_id?: string | null
          thread_id?: string | null
          voice_url?: string | null
          voice_duration_seconds?: number | null
          message_type?: MessageType
          reply_to_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          id: string
          squad_id: string | null
          user_id: string | null
          session_id: string | null
          insight_type: string
          content: Json
          is_dismissed: boolean
          is_acted_upon: boolean
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          squad_id?: string | null
          user_id?: string | null
          session_id?: string | null
          insight_type: string
          content: Json
          is_dismissed?: boolean
          is_acted_upon?: boolean
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          squad_id?: string | null
          user_id?: string | null
          session_id?: string | null
          insight_type?: string
          content?: Json
          is_dismissed?: boolean
          is_acted_upon?: boolean
          created_at?: string
          expires_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          squad_id: string
          user_id: string
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          status: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          squad_id: string
          user_id: string
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          squad_id?: string
          user_id?: string
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          read_at: string | null
          // Phase 7: Voice & Search
          voice_url: string | null
          voice_duration_seconds: number | null
          message_type: MessageType
          search_vector: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          read_at?: string | null
          voice_url?: string | null
          voice_duration_seconds?: number | null
          message_type?: MessageType
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          read_at?: string | null
          voice_url?: string | null
          voice_duration_seconds?: number | null
          message_type?: MessageType
          created_at?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      session_stats: {
        Row: {
          session_id: string
          squad_id: string
          title: string | null
          scheduled_at: string
          status: SessionStatus
          confirmed_count: number
          declined_count: number
          maybe_count: number
          present_count: number
          late_count: number
          noshow_count: number
        }
      }
      squad_members_with_profiles: {
        Row: {
          id: string
          squad_id: string
          user_id: string
          role: SquadRole
          joined_at: string
          username: string
          avatar_url: string | null
          reliability_score: number
          level: number
          xp: number
        }
      }
    }
    Functions: {
      get_best_slots: {
        Args: { p_squad_id: string; p_limit?: number }
        Returns: Array<{
          day_of_week: number
          hour: number
          avg_attendance: number
          session_count: number
        }>
      }
      get_slot_reliability: {
        Args: { p_squad_id: string; p_day_of_week: number; p_hour: number }
        Returns: number
      }
      calculate_reliability_score: {
        Args: { p_total_checkins: number; p_total_noshow: number; p_total_late: number }
        Returns: number
      }
      // Phase 6: Social Discovery RPCs
      browse_public_squads: {
        Args: { p_game?: string; p_region?: string; p_limit?: number; p_offset?: number }
        Returns: PublicSquadResult[]
      }
      get_global_leaderboard: {
        Args: { p_game?: string; p_region?: string; p_limit?: number }
        Returns: GlobalLeaderboardEntry[]
      }
      find_players_for_squad: {
        Args: { p_game?: string; p_region?: string; p_limit?: number }
        Returns: MatchmakingPlayer[]
      }
      // Phase 7: Custom Status
      update_user_status: {
        Args: { p_user_id: string; p_status_emoji: string; p_status_text: string; p_duration_minutes?: number }
        Returns: void
      }
      cleanup_expired_statuses: {
        Args: Record<string, never>
        Returns: void
      }
      // Phase 7: Threads
      get_thread_messages: {
        Args: { p_thread_id: string; p_limit?: number; p_offset?: number }
        Returns: Array<Message & { sender: { username: string; avatar_url: string | null } }>
      }
      // Phase 7: Stories
      get_feed_stories: {
        Args: { p_user_id: string }
        Returns: FeedStory[]
      }
      // Phase 7: Notifications
      should_send_notification: {
        Args: { p_user_id: string; p_notification_type: string }
        Returns: boolean
      }
      // Phase 7: Search
      search_messages: {
        Args: { p_user_id: string; p_query: string; p_squad_id?: string; p_limit?: number; p_offset?: number }
        Returns: MessageSearchResult[]
      }
      search_direct_messages: {
        Args: { p_user_id: string; p_query: string; p_other_user_id?: string; p_limit?: number; p_offset?: number }
        Returns: DMSearchResult[]
      }
      // Phase 7: Reactions
      get_message_reactions: {
        Args: { msg_id: string }
        Returns: Array<{ emoji: string; count: number; user_ids: string[] }>
      }
    }
    Enums: {
      squad_role: SquadRole
      session_status: SessionStatus
      rsvp_response: RsvpResponse
      checkin_status: CheckinStatus
      subscription_tier: SubscriptionTier
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Squad = Database['public']['Tables']['squads']['Row']
export type SquadMember = Database['public']['Tables']['squad_members']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type SessionRsvp = Database['public']['Tables']['session_rsvps']['Row']
export type SessionCheckin = Database['public']['Tables']['session_checkins']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type AIInsight = Database['public']['Tables']['ai_insights']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type DirectMessage = Database['public']['Tables']['direct_messages']['Row']
export type MessageReaction = Database['public']['Tables']['message_reactions']['Row']

// Phase 6: RPC result types
export interface PublicSquadResult {
  id: string
  name: string
  description: string | null
  game: string
  region: string | null
  member_count: number
  avg_reliability: number
  owner_username: string
  owner_avatar: string | null
  tags: string[]
  invite_code: string
  created_at: string
}

export interface GlobalLeaderboardEntry {
  rank: number
  user_id: string
  username: string
  avatar_url: string | null
  xp: number
  level: number
  reliability_score: number
  streak_days: number
  total_sessions: number
  region: string | null
}

export interface MatchmakingPlayer {
  user_id: string
  username: string
  avatar_url: string | null
  reliability_score: number
  level: number
  xp: number
  preferred_games: string[]
  region: string | null
  total_sessions: number
  playstyle: string | null
  bio: string | null
}

export interface MatchmakingRequest {
  id: string
  user_id: string
  squad_id: string
  game: string
  region: string | null
  message: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  created_at: string
  expires_at: string
}

export interface UserIntegration {
  id: string
  user_id: string
  provider: 'google_calendar' | 'twitch' | 'discord' | 'steam'
  external_id: string | null
  metadata: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

// Phase 7: Squad Channels
export interface SquadChannel {
  id: string
  squad_id: string
  name: string
  description: string | null
  channel_type: ChannelType
  is_default: boolean
  position: number
  created_by: string
  created_at: string
  updated_at: string
}

// Phase 7: Stories
export interface Story {
  id: string
  user_id: string
  squad_id: string | null
  content_type: StoryContentType
  content: string
  media_url: string | null
  background_color: string
  text_color: string
  metadata: Record<string, unknown>
  view_count: number
  expires_at: string
  created_at: string
}

export interface StoryView {
  id: string
  story_id: string
  viewer_id: string
  viewed_at: string
}

export interface FeedStory {
  story_id: string
  user_id: string
  username: string
  avatar_url: string | null
  content_type: StoryContentType
  content: string
  media_url: string | null
  background_color: string
  text_color: string
  metadata: Record<string, unknown>
  view_count: number
  has_viewed: boolean
  created_at: string
  expires_at: string
  story_count: number
}

// Phase 7: Notification Preferences
export interface NotificationPreferences {
  id: string
  user_id: string
  // Session
  session_created: boolean
  session_confirmed: boolean
  session_cancelled: boolean
  session_reminder_15min: boolean
  session_reminder_1h: boolean
  session_reminder_24h: boolean
  session_rsvp_received: boolean
  session_rsvp_changed: boolean
  session_checkin_reminder: boolean
  session_completed: boolean
  // Squad
  squad_member_joined: boolean
  squad_member_left: boolean
  squad_role_changed: boolean
  squad_settings_changed: boolean
  // Messages
  message_received: boolean
  message_mention: boolean
  message_reaction: boolean
  message_thread_reply: boolean
  dm_received: boolean
  // Party/Voice
  party_started: boolean
  party_member_joined: boolean
  incoming_call: boolean
  missed_call: boolean
  // Social
  friend_request: boolean
  friend_online: boolean
  story_from_friend: boolean
  matchmaking_request: boolean
  // Gamification
  level_up: boolean
  achievement_unlocked: boolean
  streak_at_risk: boolean
  leaderboard_rank_change: boolean
  challenge_completed: boolean
  // AI
  ai_coach_tip: boolean
  ai_slot_suggestion: boolean
  // Global
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  sound_enabled: boolean
  vibration_enabled: boolean
}

// Phase 7: Search Results
export interface MessageSearchResult {
  message_id: string
  content: string
  sender_id: string
  sender_username: string
  sender_avatar: string | null
  squad_id: string
  squad_name: string
  channel_id: string | null
  created_at: string
  relevance: number
}

export interface DMSearchResult {
  message_id: string
  content: string
  sender_id: string
  sender_username: string
  sender_avatar: string | null
  other_user_id: string
  other_username: string
  created_at: string
  relevance: number
}
