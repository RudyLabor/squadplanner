import { supabaseMinimal as supabase } from './supabaseMinimal'

/**
 * Sends push notifications to recipients when a squad message is sent.
 * Called after successful message insert — fire-and-forget (non-blocking).
 */
export async function notifySquadMessage(
  squadId: string,
  senderId: string,
  senderUsername: string,
  content: string,
  sessionId?: string | null
) {
  try {
    // Get all squad members except sender
    const { data: members } = await supabase
      .from('squad_members')
      .select('user_id')
      .eq('squad_id', squadId)
      .neq('user_id', senderId)

    if (!members?.length) return

    const { data: squad } = await supabase.from('squads').select('name').eq('id', squadId).single()

    const squadName = squad?.name || 'Squad'
    const preview = content.length > 80 ? content.slice(0, 80) + '...' : content
    const memberIds = members.map((m) => m.user_id)

    await supabase.functions.invoke('send-push', {
      body: {
        userIds: memberIds,
        title: `${senderUsername} · ${squadName}`,
        body: preview,
        icon: '/icon-192.svg',
        tag: `msg-squad-${squadId}${sessionId ? `-${sessionId}` : ''}`,
        url: '/messages',
        data: { type: 'new_message', squad_id: squadId, session_id: sessionId },
        vibrate: [100, 50, 100],
      },
    })
  } catch (err) {
    if (!import.meta.env.PROD) console.warn('[notifySquadMessage] Push failed:', err)
  }
}

/**
 * Sends push notification to the DM recipient.
 * Called after successful DM insert — fire-and-forget (non-blocking).
 */
export async function notifyDirectMessage(
  receiverId: string,
  senderId: string,
  senderUsername: string,
  content: string
) {
  try {
    const preview = content.length > 80 ? content.slice(0, 80) + '...' : content

    // Also insert an in-app notification so the realtime listener picks it up
    await supabase.from('notifications').insert({
      user_id: receiverId,
      type: 'new_dm',
      title: `Message de ${senderUsername}`,
      message: preview,
      data: { sender_id: senderId, sender_username: senderUsername },
    })

    await supabase.functions.invoke('send-push', {
      body: {
        userId: receiverId,
        title: senderUsername,
        body: preview,
        icon: '/icon-192.svg',
        tag: `dm-${senderId}`,
        url: '/messages',
        data: { type: 'new_dm', sender_id: senderId },
        vibrate: [100, 50, 100],
      },
    })
  } catch (err) {
    if (!import.meta.env.PROD) console.warn('[notifyDirectMessage] Push failed:', err)
  }
}
