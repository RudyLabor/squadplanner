import { Check, CheckCheck } from 'lucide-react'

interface MessageStatusProps {
  // Pour les messages de squad (read_by est un tableau d'IDs)
  readBy?: string[]
  // Pour les DMs (read_at est un timestamp)
  readAt?: string | null
  // ID de l'utilisateur courant (pour exclure du comptage)
  currentUserId: string
  // Nombre de destinataires attendus (pour les messages de squad)
  // Si non fourni, on considère qu'un seul lecteur suffit pour "lu"
  expectedReaders?: number
}

/**
 * Composant pour afficher le statut de lecture d'un message
 * - Un seul check gris (✓) = envoyé
 * - Double check bleu (✓✓) = lu
 */
export function MessageStatus({
  readBy,
  readAt,
  currentUserId,
  expectedReaders = 1,
}: MessageStatusProps) {
  // Pour les DMs: vérifier si read_at existe
  if (readAt !== undefined) {
    const isRead = readAt !== null
    return (
      <span className="inline-flex items-center ml-1">
        {isRead ? (
          <CheckCheck className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <Check className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={2.5} aria-hidden="true" />
        )}
        <span className="sr-only">{isRead ? 'Lu' : 'Envoye'}</span>
      </span>
    )
  }

  // Pour les messages de squad: vérifier read_by
  if (readBy !== undefined) {
    // Compter les lecteurs (exclure l'émetteur)
    const readersCount = readBy.filter(id => id !== currentUserId).length
    // Lu si au moins un autre utilisateur a lu, ou si tous les attendus ont lu
    const isRead = expectedReaders > 1
      ? readersCount >= expectedReaders - 1 // -1 car on exclut l'émetteur
      : readersCount > 0

    return (
      <span className="inline-flex items-center ml-1">
        {isRead ? (
          <CheckCheck className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <Check className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={2.5} aria-hidden="true" />
        )}
        <span className="sr-only">{isRead ? 'Lu' : 'Envoye'}</span>
      </span>
    )
  }

  // Par défaut: envoyé mais pas lu
  return (
    <span className="inline-flex items-center ml-1">
      <Check className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={2.5} aria-hidden="true" />
      <span className="sr-only">Envoye</span>
    </span>
  )
}

export default MessageStatus
