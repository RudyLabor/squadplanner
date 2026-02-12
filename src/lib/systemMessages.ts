import { supabase } from './supabase'

/**
 * Service pour l'envoi de messages système dans les chats squad
 * Les messages système sont centrés et affichés en gris italic
 */

export type SystemMessageType =
  | 'member_joined'
  | 'member_left'
  | 'session_confirmed'
  | 'session_rsvp'

interface SystemMessageOptions {
  squadId: string
  sessionId?: string
  content: string
}

/**
 * Insère un message système dans le chat d'une squad
 * Le sender_id est l'utilisateur courant (pour les permissions RLS)
 * mais is_system_message=true indique que c'est un message système
 */
export async function sendSystemMessage(
  options: SystemMessageOptions
): Promise<{ error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      console.warn('sendSystemMessage: Not authenticated, skipping')
      return { error: null } // Ne pas bloquer si non connecté
    }

    const messageData: {
      content: string
      squad_id: string
      sender_id: string
      session_id?: string
      is_system_message: boolean
      read_by: string[]
    } = {
      content: options.content,
      squad_id: options.squadId,
      sender_id: user.id,
      is_system_message: true,
      read_by: [], // Messages système = non lus pour tout le monde initialement
    }

    if (options.sessionId) {
      messageData.session_id = options.sessionId
    }

    const { error } = await supabase.from('messages').insert(messageData)

    if (error) {
      console.error('Erreur envoi message système:', error)
      return { error: error as Error }
    }

    return { error: null }
  } catch (error) {
    console.error('sendSystemMessage error:', error)
    return { error: error as Error }
  }
}

/**
 * Message: "[username] a rejoint la squad"
 */
export async function sendMemberJoinedMessage(squadId: string, username: string): Promise<void> {
  await sendSystemMessage({
    squadId,
    content: `${username} a rejoint la squad`,
  })
}

/**
 * Message: "[username] a quitté la squad"
 */
export async function sendMemberLeftMessage(squadId: string, username: string): Promise<void> {
  await sendSystemMessage({
    squadId,
    content: `${username} a quitté la squad`,
  })
}

/**
 * Message: "Session confirmée pour [date]"
 */
export async function sendSessionConfirmedMessage(
  squadId: string,
  sessionTitle: string | null,
  scheduledAt: string
): Promise<void> {
  const date = new Date(scheduledAt)
  const formattedDate = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  const title = sessionTitle || 'Session'
  await sendSystemMessage({
    squadId,
    content: `${title} confirmée pour ${formattedDate}`,
  })
}

/**
 * Message: "[username] a RSVP Oui pour [session]"
 */
export async function sendRsvpMessage(
  squadId: string,
  username: string,
  sessionTitle: string | null,
  response: 'present' | 'absent' | 'maybe'
): Promise<void> {
  const responseText = {
    present: 'Présent',
    absent: 'Absent',
    maybe: 'Peut-être',
  }[response]

  const title = sessionTitle || 'la session'
  await sendSystemMessage({
    squadId,
    content: `${username} a répondu ${responseText} pour ${title}`,
  })
}
