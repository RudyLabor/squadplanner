export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          email: string | null
          timezone: string | null
          reliability_score: number
          total_sessions: number
          total_checkins: number
          xp: number
          level: number
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          email?: string | null
          timezone?: string | null
          reliability_score?: number
          total_sessions?: number
          total_checkins?: number
          xp?: number
          level?: number
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          email?: string | null
          timezone?: string | null
          reliability_score?: number
          total_sessions?: number
          total_checkins?: number
          xp?: number
          level?: number
          bio?: string | null
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
          role: 'leader' | 'co_leader' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          squad_id: string
          user_id: string
          role?: 'leader' | 'co_leader' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          squad_id?: string
          user_id?: string
          role?: 'leader' | 'co_leader' | 'member'
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
          scheduled_at: string
          duration_minutes: number
          status: 'proposed' | 'confirmed' | 'cancelled' | 'completed'
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          squad_id: string
          title?: string | null
          game?: string | null
          scheduled_at: string
          duration_minutes?: number
          status?: 'proposed' | 'confirmed' | 'cancelled' | 'completed'
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          squad_id?: string
          title?: string | null
          game?: string | null
          scheduled_at?: string
          duration_minutes?: number
          status?: 'proposed' | 'confirmed' | 'cancelled' | 'completed'
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      session_rsvps: {
        Row: {
          id: string
          session_id: string
          user_id: string
          response: 'present' | 'absent' | 'maybe'
          responded_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          response: 'present' | 'absent' | 'maybe'
          responded_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          response?: 'present' | 'absent' | 'maybe'
          responded_at?: string
        }
        Relationships: []
      }
      session_checkins: {
        Row: {
          id: string
          session_id: string
          user_id: string
          status: 'present' | 'late' | 'noshow'
          checked_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          status: 'present' | 'late' | 'noshow'
          checked_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          status?: 'present' | 'late' | 'noshow'
          checked_at?: string
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
          created_at: string
        }
        Insert: {
          id?: string
          squad_id: string
          session_id?: string | null
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          squad_id?: string
          session_id?: string | null
          sender_id?: string
          content?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      squad_role: 'leader' | 'co_leader' | 'member'
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
