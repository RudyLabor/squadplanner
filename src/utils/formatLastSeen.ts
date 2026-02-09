/**
 * Phase 4.2.5 — Format "last seen" timestamps
 * "En ligne", "Il y a 5 min", "Il y a 2h", "Hier", etc.
 */

export function formatLastSeen(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Hors ligne'

  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMin < 1) return 'En ligne'
  if (diffMin < 2) return 'Il y a 1 min'
  if (diffMin < 60) return `Il y a ${diffMin} min`
  if (diffHours === 1) return 'Il y a 1h'
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function isRecentlyOnline(dateStr: string | null | undefined, thresholdMinutes = 5): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const now = new Date()
  return (now.getTime() - date.getTime()) < thresholdMinutes * 60 * 1000
}
