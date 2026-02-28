import { useState, useEffect, useCallback } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Users,
  Calendar,
  TrendingUp,
  ChevronRight,
  BarChart3,
  Award,
  Clock,
  Download,
  Shield,
  Plus,
  Search,
  Zap,
} from '../components/icons'
import { Card, CardContent, Button, Input, toast } from '../components/ui'
import { PremiumGate } from '../components/PremiumGate'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { useAuthStore } from '../hooks'
import { Link, useNavigate } from 'react-router'
import { MobilePageHeader } from '../components/layout/MobilePageHeader'

interface Squad {
  id: string
  name: string
  game?: string
  region?: string
  member_count: number
  session_count: number
  avg_attendance_rate: number
  avg_reliability_score: number
  created_at: string
  leader_id?: string
}

interface ClubStats {
  totalMembers: number
  sessionsThisWeek: number
  avgAttendanceRate: number
  avgReliabilityScore: number
}

interface TopMember {
  user_id: string
  username: string
  reliability_score: number
  squad_name: string
}

export function ClubDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id
  const [squads, setSquads] = useState<Squad[]>([])
  const [clubStats, setClubStats] = useState<ClubStats>({
    totalMembers: 0,
    sessionsThisWeek: 0,
    avgAttendanceRate: 0,
    avgReliabilityScore: 0,
  })
  const [topMembers, setTopMembers] = useState<TopMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clubName, setClubName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('primary')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch all squads where user is leader
  useEffect(() => {
    if (!userId) return

    const fetchClubData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch squads where user is leader
        const { data: leadSquads, error: squadsError } = await supabase
          .from('squad_members')
          .select('squad_id, squads(*)')
          .eq('user_id', userId)
          .eq('role', 'leader')

        if (squadsError) throw squadsError

        // Transform squads data with stats
        const squadsData: Squad[] = []
        let totalMembers = 0
        let totalAttendance = 0
        let totalReliability = 0
        const squadIds: string[] = []

        if (leadSquads && leadSquads.length > 0) {
          for (const item of leadSquads) {
            if (item.squads) {
              const squad = item.squads
              squadIds.push(squad.id)

              // Fetch member count for this squad
              const { data: memberData } = await supabase
                .from('squad_members')
                .select('id')
                .eq('squad_id', squad.id)

              const memberCount = memberData?.length || 0
              totalMembers += memberCount

              // Fetch sessions count for this squad (this week)
              const oneWeekAgo = new Date()
              oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

              const { data: sessionsData } = await supabase
                .from('sessions')
                .select('id')
                .eq('squad_id', squad.id)
                .gte('scheduled_at', oneWeekAgo.toISOString())

              const sessionCount = sessionsData?.length || 0

              // Fetch average reliability from profiles of squad members
              const { data: memberIds } = await supabase
                .from('squad_members')
                .select('user_id')
                .eq('squad_id', squad.id)

              let avgReliability = 0
              let avgAttendance = 0

              if (memberIds && memberIds.length > 0) {
                const { data: profilesData } = await supabase
                  .from('profiles')
                  .select('reliability_score')
                  .in('id', memberIds.map((m: { user_id: string }) => m.user_id))

                if (profilesData && profilesData.length > 0) {
                  avgReliability =
                    profilesData.reduce((sum: number, p: { reliability_score?: number }) => sum + (p.reliability_score || 0), 0) /
                    profilesData.length
                  avgAttendance = avgReliability // Use reliability as proxy for attendance
                }
              }

              totalReliability += avgReliability
              totalAttendance += avgAttendance

              squadsData.push({
                id: squad.id,
                name: squad.name || 'Squad sans nom',
                game: squad.game,
                region: squad.region,
                member_count: memberCount,
                session_count: sessionCount,
                avg_attendance_rate: Math.round(avgAttendance),
                avg_reliability_score: Math.round(avgReliability),
                created_at: squad.created_at,
                leader_id: squad.owner_id,
              })
            }
          }
        }

        setSquads(squadsData)

        // Calculate club stats
        const squadCount = squadsData.length || 1
        setClubStats({
          totalMembers,
          sessionsThisWeek: squadsData.reduce((sum, s) => sum + s.session_count, 0),
          avgAttendanceRate: Math.round(totalAttendance / squadCount),
          avgReliabilityScore: Math.round(totalReliability / squadCount),
        })

        // Fetch top 5 most reliable members across all squads
        if (squadIds.length > 0) {
          // Get all member user_ids across squads
          const { data: allMembers } = await supabase
            .from('squad_members')
            .select('user_id, squad_id')
            .in('squad_id', squadIds)

          if (allMembers && allMembers.length > 0) {
            const uniqueUserIds = [...new Set(allMembers.map((m: { user_id: string }) => m.user_id))]

            // Fetch profiles with reliability_score
            const { data: profilesWithScore } = await supabase
              .from('profiles')
              .select('id, username, reliability_score')
              .in('id', uniqueUserIds)
              .order('reliability_score', { ascending: false })
              .limit(5)

            if (profilesWithScore) {
              // Build a map of user_id -> squad_name for display
              const userSquadMap: Record<string, string> = {}
              for (const m of allMembers) {
                if (!userSquadMap[m.user_id]) {
                  const squad = squadsData.find((s) => s.id === m.squad_id)
                  userSquadMap[m.user_id] = squad?.name || 'Squad'
                }
              }

              const topMembersData: TopMember[] = profilesWithScore
                .filter((p: { reliability_score?: number }) => p.reliability_score && p.reliability_score > 0)
                .map((p: { id: string; username?: string; reliability_score?: number }) => ({
                  user_id: p.id,
                  username: p.username || 'Utilisateur',
                  reliability_score: p.reliability_score || 0,
                  squad_name: userSquadMap[p.id] || 'Squad',
                }))
              setTopMembers(topMembersData)
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors du chargement'
        setError(message)
        if (!import.meta.env.PROD) console.error('Error fetching club data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchClubData()
  }, [userId])

  // CSV Export handler
  const handleExportCSV = useCallback(() => {
    const headers = ['Squad', 'Membres', 'Sessions', 'Taux présence', 'Fiabilité']
    const rows = squads.map((s) => [
      s.name,
      s.member_count.toString(),
      s.session_count.toString(),
      `${s.avg_attendance_rate}%`,
      `${s.avg_reliability_score}%`,
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `club-stats-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
    toast.success('Export CSV téléchargé !')
  }, [squads])

  // PDF Export handler (placeholder)
  const handleExportPDF = useCallback(() => {
    toast.info('Export PDF bientôt disponible')
  }, [])

  // Color presets
  const colorOptions = [
    { value: 'primary', label: 'Bleu', bgClass: 'bg-primary-bg' },
    { value: 'success', label: 'Vert', bgClass: 'bg-success' },
    { value: 'warning', label: 'Jaune', bgClass: 'bg-warning' },
    { value: 'error', label: 'Rouge', bgClass: 'bg-error' },
    { value: 'info', label: 'Cyan', bgClass: 'bg-info' },
    { value: 'purple', label: 'Violet', bgClass: 'bg-purple' },
  ]

  // Filter squads based on search
  const filteredSquads = squads.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.game && s.game.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 pb-24">
        <MobilePageHeader title="Dashboard Club" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-bg-elevated rounded-xl animate-pulse border border-border-subtle"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <PremiumGate feature="club_dashboard" fallback="blur">
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 pb-24 mesh-bg"
      >
        <MobilePageHeader title="Dashboard Club" />

        {error && (
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-error/10 border border-error/20 rounded-xl p-4 mb-6 text-error-primary"
          >
            {error}
          </m.div>
        )}

        {/* Header Section */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden lg:flex items-center gap-3 mb-8"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Dashboard Club</h1>
            <p className="text-sm text-text-tertiary">Gère tous tes squads en un seul endroit</p>
          </div>
        </m.div>

        {/* KPI Cards Grid */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {/* Total Members Card */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-2 right-2 w-16 h-16 bg-primary-bg rounded-full blur-2xl" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-text-tertiary text-sm font-medium">Membres totaux</span>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <m.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="text-3xl font-bold text-text-primary"
                >
                  {clubStats.totalMembers}
                </m.div>
                <p className="text-xs text-text-tertiary mt-2">
                  Dans {squads.length} squad{squads.length !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sessions This Week Card */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-2 right-2 w-16 h-16 bg-success rounded-full blur-2xl" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-text-tertiary text-sm font-medium">
                    Sessions cette semaine
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-success" />
                  </div>
                </div>
                <m.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.35, type: 'spring' }}
                  className="text-3xl font-bold text-text-primary"
                >
                  {clubStats.sessionsThisWeek}
                </m.div>
                <p className="text-xs text-text-tertiary mt-2">
                  {clubStats.sessionsThisWeek > 0 ? 'Programmées' : 'Aucune programmée'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Rate Card */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-2 right-2 w-16 h-16 bg-warning rounded-full blur-2xl" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-text-tertiary text-sm font-medium">
                    Taux présence moyen
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                </div>
                <m.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                  className="text-3xl font-bold text-text-primary"
                >
                  {clubStats.avgAttendanceRate}%
                </m.div>
                <div className="mt-2 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                  <m.div
                    initial={{ width: 0 }}
                    animate={{ width: `${clubStats.avgAttendanceRate}%` }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="h-full bg-gradient-to-r from-warning to-success"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reliability Score Card */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-2 right-2 w-16 h-16 bg-info rounded-full blur-2xl" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-text-tertiary text-sm font-medium">Fiabilité moyenne</span>
                  <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-info" />
                  </div>
                </div>
                <m.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.45, type: 'spring' }}
                  className="text-3xl font-bold text-text-primary"
                >
                  {clubStats.avgReliabilityScore}%
                </m.div>
                <p className="text-xs text-text-tertiary mt-2">
                  {clubStats.avgReliabilityScore >= 95
                    ? 'Ultra-fiable'
                    : clubStats.avgReliabilityScore >= 80
                      ? 'Très fiable'
                      : 'À améliorer'}
                </p>
              </div>
            </CardContent>
          </Card>
        </m.div>

        <hr className="section-divider my-8" />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Squads */}
          <div className="lg:col-span-2">
            {/* Squads Header */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-text-primary">Squads ({squads.length})</h2>
              </div>
              <Link to="/squads">
                <Button variant="primary" size="sm" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Ajouter squad</span>
                  <span className="sm:hidden">Ajouter</span>
                </Button>
              </Link>
            </m.div>

            {/* Search Bar */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mb-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <Input
                  type="text"
                  placeholder="Chercher une squad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </m.div>

            {/* Squads List */}
            <AnimatePresence mode="popLayout">
              {filteredSquads.length === 0 ? (
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-12"
                >
                  <Users className="w-12 h-12 text-text-tertiary/50 mx-auto mb-4" />
                  <p className="text-text-tertiary mb-4">
                    {searchQuery
                      ? 'Aucune squad trouvée'
                      : "Tu n'as pas encore de squad. Crée-en une !"}
                  </p>
                  {!searchQuery && (
                    <Link to="/squads">
                      <Button variant="primary" size="sm">
                        Créer ma première squad
                      </Button>
                    </Link>
                  )}
                </m.div>
              ) : (
                <div className="space-y-3">
                  {filteredSquads.map((squad, idx) => (
                    <m.div
                      key={squad.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: 0.25 + idx * 0.05 }}
                    >
                      <Link to={`/squad/${squad.id}/analytics`}>
                        <Card className="hover:bg-bg-elevated/80 transition-colors cursor-pointer group">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-text-primary group-hover:text-primary transition-colors">
                                  {squad.name}
                                </h3>
                                {squad.game && (
                                  <p className="text-xs text-text-tertiary">{squad.game}</p>
                                )}
                              </div>
                              <ChevronRight className="w-5 h-5 text-text-tertiary group-hover:text-primary transition-colors transform group-hover:translate-x-1" />
                            </div>

                            <div className="grid grid-cols-4 gap-2 text-xs">
                              <div className="bg-bg-base/50 rounded-lg p-2 text-center">
                                <div className="font-bold text-text-primary">
                                  {squad.member_count}
                                </div>
                                <div className="text-text-tertiary">Membres</div>
                              </div>
                              <div className="bg-bg-base/50 rounded-lg p-2 text-center">
                                <div className="font-bold text-text-primary">
                                  {squad.session_count}
                                </div>
                                <div className="text-text-tertiary">Sessions</div>
                              </div>
                              <div className="bg-bg-base/50 rounded-lg p-2 text-center">
                                <div className="font-bold text-success">
                                  {squad.avg_attendance_rate}%
                                </div>
                                <div className="text-text-tertiary">Présence</div>
                              </div>
                              <div className="bg-bg-base/50 rounded-lg p-2 text-center">
                                <div className="font-bold text-info">
                                  {squad.avg_reliability_score}%
                                </div>
                                <div className="text-text-tertiary">Fiabilité</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </m.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Analytics & Settings */}
          <div className="space-y-6">
            {/* Cross-Squad Analytics */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Top 5 Fiables
                  </h3>

                  {topMembers.length === 0 ? (
                    <p className="text-sm text-text-tertiary text-center py-4">
                      Aucune donnée disponible
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {topMembers.map((member, idx) => (
                        <m.div
                          key={member.user_id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + idx * 0.05 }}
                          className="flex items-center justify-between p-3 bg-bg-base/50 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-text-primary text-sm truncate">
                              {member.username}
                            </p>
                            <p className="text-xs text-text-tertiary truncate">
                              {member.squad_name}
                            </p>
                          </div>
                          <div className="ml-2 flex items-center gap-1">
                            <Award className="w-4 h-4 text-warning" />
                            <span className="font-bold text-text-primary">
                              {member.reliability_score}%
                            </span>
                          </div>
                        </m.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </m.div>

            {/* Export Section */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5 text-primary" />
                    Exports
                  </h3>

                  <div className="space-y-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleExportCSV}
                      className="w-full justify-start"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exporter CSV
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleExportPDF}
                      className="w-full justify-start opacity-50"
                      disabled
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exporter PDF (bientôt)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </m.div>

            {/* Club Branding Section */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-warning" />
                    Branding Club
                  </h3>

                  {/* Club Name Input */}
                  <div className="mb-4">
                    <label className="text-xs font-medium text-text-tertiary mb-2 block">
                      Nom du club
                    </label>
                    <input
                      type="text"
                      placeholder="Mon Club Esports"
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-base border border-border-subtle rounded-lg text-text-primary text-sm placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="text-xs font-medium text-text-tertiary mb-3 block">
                      Couleur primaire
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {colorOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setPrimaryColor(option.value)}
                          className={`p-3 rounded-lg text-xs font-medium text-white transition-all ${option.bgClass} ${
                            primaryColor === option.value
                              ? 'ring-2 ring-offset-2 ring-offset-bg-elevated ring-white'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo Upload Placeholder */}
                  <div className="mt-4 p-4 border-2 border-dashed border-border-subtle rounded-lg text-center bg-bg-base/50">
                    <p className="text-sm text-text-tertiary mb-2">Logo du club</p>
                    <Button variant="ghost" size="sm" disabled className="opacity-50">
                      Choisir un fichier
                    </Button>
                    <p className="text-xs text-text-quaternary mt-1">(bientôt disponible)</p>
                  </div>
                </CardContent>
              </Card>
            </m.div>
          </div>
        </div>
      </m.div>
    </PremiumGate>
  )
}

export default ClubDashboard
