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
