import type { RealtimeChannel } from '@supabase/supabase-js'

export interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read_at: string | null
  created_at: string
  sender?: {
    username?: string
    avatar_url?: string | null
  }
}

export interface DMConversation {
  other_user_id: string
  other_user_username: string
  other_user_avatar_url: string | null
  last_message_content: string | null
  last_message_at: string | null
  last_message_sender_id: string | null
  unread_count: number
}

export interface DirectMessagesState {
  messages: DirectMessage[]
  conversations: DMConversation[]
  activeConversation: DMConversation | null
  isLoading: boolean
  realtimeChannel: RealtimeChannel | null

  fetchConversations: () => Promise<void>
  fetchMessages: (otherUserId: string) => Promise<void>
  sendMessage: (content: string, receiverId: string) => Promise<{ error: Error | null }>
  setActiveConversation: (conversation: DMConversation | null) => void
  subscribeToMessages: (otherUserId: string) => void
  unsubscribe: () => void
  markAsRead: (otherUserId: string) => Promise<void>
  startConversation: (userId: string) => Promise<DMConversation | null>
  getTotalUnread: () => number
}
