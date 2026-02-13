import { useState, useEffect, useCallback, useRef } from 'react'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface TypingUser {
  userId: string
  username: string
  timestamp: number
}

interface UseTypingIndicatorOptions {
  // Type de conversation
  conversationType: 'squad' | 'dm'
  // ID de la conversation (squad_id ou otherUserId)
  conversationId: string
  // ID de session (optionnel, pour les chats de session)
  sessionId?: string
  // Nom d'utilisateur actuel
  currentUsername: string
}

interface UseTypingIndicatorReturn {
  // Liste des utilisateurs qui tapent
  typingUsers: TypingUser[]
  // Fonction à appeler quand l'utilisateur tape
  handleTyping: () => void
  // Texte formaté à afficher (ex: "Pierre écrit..." ou "Pierre et Marie écrivent...")
  typingText: string | null
}

const TYPING_TIMEOUT = 3000 // 3 secondes d'inactivité avant de supprimer
const DEBOUNCE_DELAY = 500 // 500ms entre chaque broadcast

export function useTypingIndicator({
  conversationType,
  conversationId,
  sessionId,
  currentUsername,
}: UseTypingIndicatorOptions): UseTypingIndicatorReturn {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const lastBroadcastRef = useRef<number>(0)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Récupérer l'utilisateur courant
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user
      if (user) setCurrentUserId(user.id)
    })
  }, [])

  // Générer un nom de canal unique pour la conversation
  const getChannelName = useCallback(() => {
    if (conversationType === 'dm') {
      // Pour les DMs, trier les IDs pour avoir un canal unique
      if (!currentUserId) return null
      const sortedIds = [currentUserId, conversationId].sort().join(':')
      return `typing:dm:${sortedIds}`
    }
    // Pour les squads
    if (sessionId) {
      return `typing:session:${sessionId}`
    }
    return `typing:squad:${conversationId}`
  }, [conversationType, conversationId, sessionId, currentUserId])

  // Nettoyer les utilisateurs qui ont arrêté de taper
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTypingUsers((prev) => prev.filter((user) => now - user.timestamp < TYPING_TIMEOUT))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // S'abonner au canal de typing
  useEffect(() => {
    const channelName = getChannelName()
    if (!channelName || !currentUserId) return

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, username } = payload.payload as { userId: string; username: string }

        // Ne pas afficher si c'est l'utilisateur courant
        if (userId === currentUserId) return

        setTypingUsers((prev) => {
          const existing = prev.find((u) => u.userId === userId)
          if (existing) {
            // Mettre à jour le timestamp
            return prev.map((u) => (u.userId === userId ? { ...u, timestamp: Date.now() } : u))
          }
          // Ajouter le nouvel utilisateur
          return [...prev, { userId, username, timestamp: Date.now() }]
        })
      })
      .on('broadcast', { event: 'stop_typing' }, (payload) => {
        const { userId } = payload.payload as { userId: string }
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId))
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [getChannelName, currentUserId])

  // Fonction pour envoyer l'événement de typing
  const handleTyping = useCallback(() => {
    if (!channelRef.current || !currentUserId) return

    const now = Date.now()

    // Debounce: ne pas spammer les événements
    if (now - lastBroadcastRef.current < DEBOUNCE_DELAY) return
    lastBroadcastRef.current = now

    // Envoyer l'événement de typing
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: currentUserId,
        username: currentUsername,
      },
    })

    // Annuler le timeout précédent
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Programmer l'arrêt du typing
    typingTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'stop_typing',
          payload: {
            userId: currentUserId,
          },
        })
      }
    }, TYPING_TIMEOUT)
  }, [currentUserId, currentUsername])

  // Générer le texte de typing
  const typingText = useCallback(() => {
    if (typingUsers.length === 0) return null
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} écrit...`
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].username} et ${typingUsers[1].username} écrivent...`
    }
    return `${typingUsers[0].username} et ${typingUsers.length - 1} autres écrivent...`
  }, [typingUsers])

  return {
    typingUsers,
    handleTyping,
    typingText: typingText(),
  }
}

export default useTypingIndicator
