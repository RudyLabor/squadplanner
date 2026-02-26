import { memo } from 'react'
import { Calendar, Download, ExternalLink } from './icons'
import {
  sessionToCalendarEvent,
  getGoogleCalendarUrl,
  exportSessionsToICS,
} from '../utils/calendarExport'
import { showSuccess, showError, showInfo } from '../lib/toast'
import type { Session } from '../types/database'

interface Props {
  sessions?: Session[]
  session?: Session
  squadName?: string
}

export const CalendarSyncCard = memo(function CalendarSyncCard({
  sessions,
  session,
  squadName,
}: Props) {
  const handleGoogleCalendar = () => {
    if (session) {
      const event = sessionToCalendarEvent(session, squadName)
      const url = getGoogleCalendarUrl(event)
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      showInfo("Sélectionne une session pour l'ajouter à Google Calendar")
    }
  }

  const handleDownloadICS = () => {
    try {
      const toExport = sessions || (session ? [session] : [])
      if (toExport.length === 0) {
        showError('Aucune session à exporter')
        return
      }
      exportSessionsToICS(toExport, squadName)
      showSuccess('Fichier .ics téléchargé !')
    } catch (err) {
      showError((err as Error).message || "Erreur d'export")
    }
  }

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border border-border-subtle bg-surface-card">
      <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
      <span className="text-xs text-text-secondary flex-1">Calendrier</span>
      <div className="flex gap-1.5">
        {session && (
          <button
            onClick={handleGoogleCalendar}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Google
          </button>
        )}
        <button
          onClick={handleDownloadICS}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm bg-overlay-subtle text-text-secondary hover:bg-overlay-light transition-colors"
        >
          <Download className="w-3 h-3" />
          .ics
        </button>
      </div>
    </div>
  )
})
