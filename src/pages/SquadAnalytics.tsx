import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { m } from 'framer-motion'
import { ArrowLeft } from '../components/icons'
import { useAuthStore, usePremiumStore } from '../hooks'
import { PremiumGate } from '../components/PremiumGate'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import AttendanceHeatmap from '../components/squad-analytics/AttendanceHeatmap'
import MemberReliabilityChart from '../components/squad-analytics/MemberReliabilityChart'
import SessionTrends from '../components/squad-analytics/SessionTrends'
import BestSlotsCard from '../components/squad-analytics/BestSlotsCard'

export default function SquadAnalytics() {
  const { id } = useParams<{ id: string }>()
  const { user, isInitialized } = useAuthStore()
  const { fetchPremiumStatus } = usePremiumStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isInitialized && user?.id) {
      fetchPremiumStatus()
      setIsLoading(false)
    }
  }, [isInitialized, user?.id, fetchPremiumStatus])

  if (!id) {
    return (
      <div className="min-h-screen bg-bg-base text-text-primary p-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-text-secondary">Squad non trouvée</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* En-tête */}
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Link
              to={`/squad/${id}`}
              className="p-2 hover:bg-surface-card rounded-lg transition-colors"
              aria-label="Retour à la squad"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold">Analytics Squad</h1>
          </div>
          <p className="text-text-secondary">Découvre les statistiques détaillées de ta squad</p>
        </m.div>

        {/* Grille d'analytics */}
        <PremiumGate feature="team_analytics" squadId={id} fallback="blur">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Heatmap Attendance */}
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface-card border border-border-subtle rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Heatmap de présence</h2>
              <AttendanceHeatmap squadId={id} />
            </m.div>

            {/* Member Reliability */}
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface-card border border-border-subtle rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Fiabilité des membres</h2>
              <MemberReliabilityChart squadId={id} />
            </m.div>

            {/* Session Trends */}
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-surface-card border border-border-subtle rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Tendance des sessions</h2>
              <SessionTrends squadId={id} />
            </m.div>

            {/* Best Slots */}
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-surface-card border border-border-subtle rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Meilleurs créneaux</h2>
              <BestSlotsCard squadId={id} />
            </m.div>
          </div>
        </PremiumGate>

        {error && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
          >
            {error}
          </m.div>
        )}
      </div>
    </div>
  )
}
