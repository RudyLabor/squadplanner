import { memo } from 'react'
import { motion } from 'framer-motion'
import { FileText, Users, Clock, AlertTriangle, Award } from 'lucide-react'
import { useSessionSummaryQuery } from '../hooks/queries'

interface Props {
  sessionId: string
  sessionStatus: string
}

export const AISessionSummary = memo(function AISessionSummary({ sessionId, sessionStatus }: Props) {
  const { data: summary, isLoading } = useSessionSummaryQuery(sessionId, sessionStatus)

  if (sessionStatus !== 'completed') return null
  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/5 bg-surface-card p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-white/10" />
          <div className="h-4 w-32 bg-white/10 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-white/5 rounded" />
          <div className="h-3 w-3/4 bg-white/5 rounded" />
        </div>
      </div>
    )
  }
  if (!summary) return null

  const { stats } = summary

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/5 bg-surface-card p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4.5 h-4.5 text-indigo-400" />
        <h3 className="text-sm font-semibold text-text-primary">Resume de session</h3>
        {summary.ai_generated && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium">IA</span>
        )}
      </div>

      <p className="text-sm text-text-secondary leading-relaxed mb-3">{summary.summary}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatBadge
          icon={<Users className="w-3.5 h-3.5" />}
          label="Presents"
          value={`${stats.present_count}`}
          color="text-emerald-400"
        />
        <StatBadge
          icon={<Clock className="w-3.5 h-3.5" />}
          label="En retard"
          value={`${stats.late_count}`}
          color="text-amber-400"
        />
        <StatBadge
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          label="Absents"
          value={`${stats.noshow_count}`}
          color={stats.noshow_count > 0 ? 'text-rose-400' : 'text-text-tertiary'}
        />
        {stats.mvp_username && (
          <StatBadge
            icon={<Award className="w-3.5 h-3.5" />}
            label="MVP"
            value={stats.mvp_username}
            color="text-amber-300"
          />
        )}
      </div>

      {stats.attendance_rate > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                stats.attendance_rate >= 80 ? 'bg-emerald-500' :
                stats.attendance_rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${stats.attendance_rate}%` }}
              transition={{ delay: 0.3, duration: 0.8 }}
            />
          </div>
          <span className="text-xs text-text-tertiary font-medium">{stats.attendance_rate}%</span>
        </div>
      )}
    </motion.div>
  )
})

function StatBadge({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/3">
      <span className={color}>{icon}</span>
      <div>
        <p className="text-xs text-text-tertiary">{label}</p>
        <p className={`text-xs font-medium ${color}`}>{value}</p>
      </div>
    </div>
  )
}
