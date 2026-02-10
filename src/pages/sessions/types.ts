export interface SessionEntry {
  id: string
  title?: string
  game?: string
  scheduled_at: string
  my_rsvp?: string
  rsvp_counts?: { present?: number; maybe?: number; absent?: number }
  status?: string
}

export interface SlotSuggestion {
  day_of_week: number
  hour: number
  reliability_score: number
}

export interface CoachTip {
  content: string
}

export const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  }).format(date)
}