import { useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './useAuth'
import { showError } from '../lib/toast'

interface SendVoiceMessageParams {
  audioBlob: Blob
  duration: number
  squadId?: string
  sessionId?: string
  receiverId?: string // For DMs
  threadId?: string
}

export function useVoiceMessages() {
  const { user } = useAuthStore()

  const sendVoiceMutation = useMutation({
    mutationFn: async (params: SendVoiceMessageParams) => {
      if (!user?.id) throw new Error('Non connecté')

      const { audioBlob, duration, squadId, sessionId, receiverId, threadId } = params

      // 1. Upload to Supabase Storage
      const fileName = `${user.id}/${Date.now()}.webm`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          cacheControl: '3600',
        })

      if (uploadError) {
        // If bucket doesn't exist, create a fallback text message
        if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
          console.warn('voice-messages bucket not found, sending as text')
          const durationText = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`
          const content = `🎤 Message vocal (${durationText})`

          if (receiverId) {
            const { error } = await supabase
              .from('direct_messages')
              .insert({ content, sender_id: user.id, receiver_id: receiverId })
            if (error) throw error
          } else if (squadId) {
            const { error } = await supabase.from('messages').insert({
              content,
              sender_id: user.id,
              squad_id: squadId,
              session_id: sessionId || null,
              thread_id: threadId || null,
              message_type: 'voice',
              voice_duration_seconds: duration,
              read_by: [user.id],
            })
            if (error) throw error
          }
          return
        }
        throw uploadError
      }

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(uploadData.path)

      const voiceUrl = urlData.publicUrl
      const durationText = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`

      // 3. Insert message with voice metadata
      if (receiverId) {
        // DM voice message
        const { error } = await supabase.from('direct_messages').insert({
          content: `🎤 Message vocal (${durationText})`,
          sender_id: user.id,
          receiver_id: receiverId,
          voice_url: voiceUrl,
          voice_duration_seconds: duration,
          message_type: 'voice',
        })
        if (error) throw error
      } else if (squadId) {
        // Squad voice message
        const { error } = await supabase.from('messages').insert({
          content: `🎤 Message vocal (${durationText})`,
          sender_id: user.id,
          squad_id: squadId,
          session_id: sessionId || null,
          thread_id: threadId || null,
          voice_url: voiceUrl,
          voice_duration_seconds: duration,
          message_type: 'voice',
          read_by: [user.id],
        })
        if (error) throw error
      }
    },
    onError: (err: Error) => {
      console.warn('Voice message error:', err)
      showError("Erreur lors de l'envoi du message vocal")
    },
  })

  const sendVoiceMessage = useCallback(
    (params: SendVoiceMessageParams) => {
      return sendVoiceMutation.mutateAsync(params)
    },
    [sendVoiceMutation]
  )

  return {
    sendVoiceMessage,
    isSending: sendVoiceMutation.isPending,
  }
}

// Helper to check if a message is a voice message
export function isVoiceMessage(message: {
  voice_url?: string | null
  message_type?: string
  content?: string
}): boolean {
  return (
    !!message.voice_url ||
    message.message_type === 'voice' ||
    !!message.content?.startsWith('🎤 Message vocal')
  )
}

// Extract duration from voice message content (fallback when no voice_duration_seconds)
export function extractVoiceDuration(content: string): number | null {
  const match = content.match(/\((\d+):(\d+)\)/)
  if (!match) return null
  return parseInt(match[1]) * 60 + parseInt(match[2])
}
