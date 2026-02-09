import { memo } from 'react'
import { Calendar, Download, ExternalLink } from 'lucide-react'
import { sessionToCalendarEvent, getGoogleCalendarUrl, exportSessionsToICS } from '../utils/calendarExport'
import { toast } from 'sonner'
import type { Session } from '../types/database'

interface Props {
  sessions?: Session[]
  session?: Session
  squadName?: string
}

export const CalendarSyncCard = memo(function CalendarSyncCard({ sessions, session, squadName }: Props) {
  const handleGoogleCalendar = () => {
    if (session) {
      const event = sessionToCalendarEvent(session, squadName)
      const url = getGoogleCalendarUrl(event)
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      toast.info('Selectionne une session pour l\'ajouter a Google Calendar')
    }
  }

  const handleDownloadICS = () => {
    try {
      const toExport = sessions || (session ? [session] : [])
      if (toExport.length === 0) {
        toast.error('Aucune session a exporter')
        return
      }
      exportSessionsToICS(toExport, squadName)
      toast.success('Fichier .ics telecharge !')
    } catch (err) {
      toast.error((err as Error).message || 'Erreur d\'export')
    }
  }

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border border-white/5 bg-surface-card">
      <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
      <span className="text-xs text-text-secondary flex-1">Calendrier</span>
      <div className="flex gap-1.5">
        {session && (
          <button
            onClick={handleGoogleCalendar}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Google
          </button>
        )}
        <button
          onClick={handleDownloadICS}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-white/5 text-text-secondary hover:bg-white/10 transition-colors"
        >
          <Download className="w-3 h-3" />
          .ics
        </button>
      </div>
    </div>
  )
})
