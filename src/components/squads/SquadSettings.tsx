import { useMemo } from 'react'
import {
  Trash2,
  LogOut,
  ChevronRight,
  UserPlus,
  Calendar,
  MessageCircle,
  Settings,
  BarChart3,
  Download,
  Zap,
  Trophy,
  Loader2,
} from '../icons'
import { useNavigate } from 'react-router'
import { Button, Card, Drawer } from '../ui'
import { PremiumGate, PremiumBadge } from '../PremiumGate'
import { SquadLeaderboard } from '../SquadLeaderboard'
import { exportSessionsToICS } from '../../utils/calendarExport'

interface RawLeaderboardEntry {
  user_id: string
  username: string
  avatar_url?: string | null
  total_present?: number
  total_sessions?: number
  reliability?: number
  // Fields from the RPC if it returns the full shape
  rank?: number
  xp?: number
  level?: number
  reliability_score?: number
  streak_days?: number
}

interface SquadSettingsProps {
  squadId: string
  squadName?: string
  isOwner: boolean
  // Stats data
  sessionsCount: number
  memberCount: number
  avgReliability: number
  canAccessAdvancedStats: boolean
  // Leaderboard
  leaderboard: RawLeaderboardEntry[]
  leaderboardLoading: boolean
  currentUserId: string
  // Premium
  isSquadPremium: boolean
  // Sessions for export
  sessions: Array<{ id: string; title?: string | null; scheduled_at: string; status: string }>
  // Actions
  onLeaveSquad: () => void
  onDeleteSquad: () => void
  onInviteClick: () => void
  onCreateSessionClick: () => void
  onEditSquadClick?: () => void
  // Drawer
  showActionsDrawer: boolean
  onOpenActionsDrawer: () => void
  onCloseActionsDrawer: () => void
  // Feedback
  onSuccess: (msg: string) => void
}

export function SquadSettings({
  squadId,
  squadName,
  isOwner,
  sessionsCount,
  memberCount,
  avgReliability,
  canAccessAdvancedStats,
  leaderboard,
  leaderboardLoading,
  currentUserId,
  isSquadPremium,
  sessions,
  onLeaveSquad,
  onDeleteSquad,
  onInviteClick,
  onCreateSessionClick,
  onEditSquadClick,
  showActionsDrawer,
  onOpenActionsDrawer,
  onCloseActionsDrawer,
  onSuccess,
}: SquadSettingsProps) {
  const navigate = useNavigate()

  // Transform raw leaderboard data to the format SquadLeaderboard expects
  const transformedLeaderboard = useMemo(() => {
    return (leaderboard || [])
      .map((entry, index) => ({
        rank: entry.rank ?? index + 1,
        user_id: entry.user_id,
        username: entry.username,
        avatar_url: entry.avatar_url ?? null,
        xp: entry.xp ?? (entry.total_present ?? 0) * 10,
        level: entry.level ?? Math.max(1, Math.floor(((entry.total_present ?? 0) * 10) / 100) + 1),
        reliability_score: entry.reliability_score ?? entry.reliability ?? 100,
        streak_days: entry.streak_days ?? 0,
      }))
      .sort((a, b) => b.xp - a.xp)
      .map((entry, index) => ({ ...entry, rank: entry.rank ?? index + 1 }))
  }, [leaderboard])

  return (
    <>
      {/* Stats Avancees - Premium */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-semibold text-text-primary">Stats avancées</h2>
          {!canAccessAdvancedStats && <PremiumBadge small />}
        </div>
        <PremiumGate feature="advanced_stats" squadId={squadId} fallback="lock">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-md font-medium text-text-primary">Analyse de la squad</h3>
                <p className="text-sm text-text-quaternary">Tendances et performances</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-surface-card">
                <div className="text-xl font-bold text-success">{sessionsCount}</div>
                <div className="text-xs text-text-quaternary">Sessions</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-card">
                <div className="text-xl font-bold text-primary">{memberCount}</div>
                <div className="text-xs text-text-quaternary">Membres</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-card">
                <div className="text-xl font-bold text-warning">{Math.round(avgReliability)}%</div>
                <div className="text-xs text-text-quaternary">Fiabilité</div>
              </div>
            </div>
          </Card>
        </PremiumGate>
      </div>

      {/* Export Calendrier - Premium */}
      <div className="mb-6">
        <PremiumGate
          feature="calendar_export"
          featureLabel="Export calendrier"
          squadId={squadId}
          fallback="lock"
        >
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
                  <Download className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="text-md font-medium text-text-primary">Export calendrier</h3>
                  <p className="text-sm text-text-quaternary">Synchronise avec Google, Apple...</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  try {
                    exportSessionsToICS(sessions, squadName)
                    onSuccess(
                      'Calendrier exporté ! Importe le fichier .ics dans ton app calendrier.'
                    )
                  } catch (error) {
                    onSuccess(error instanceof Error ? error.message : "Erreur lors de l'export")
                  }
                }}
              >
                <Download className="w-4 h-4" />
                Exporter
              </Button>
            </div>
          </Card>
        </PremiumGate>
      </div>

      {/* Audio HD Badge si premium */}
      {isSquadPremium && (
        <div className="mb-6">
          <Card className="p-4 bg-gradient-to-br from-warning/8 to-warning/[0.01] border-warning/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
                <Zap className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-md font-medium text-text-primary">Squad Premium</h3>
                  <PremiumBadge small />
                </div>
                <p className="text-sm text-text-quaternary">
                  Audio HD, stats avancées, export calendrier actifs
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Classement Squad */}
      {transformedLeaderboard.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-warning" />
            Classement
          </h3>
          <SquadLeaderboard entries={transformedLeaderboard} currentUserId={currentUserId} />
        </div>
      )}
      {leaderboardLoading && (
        <div className="mb-6 flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-text-quaternary" />
        </div>
      )}

      {/* Actions squad */}
      <div className="mt-6">
        {/* Desktop: direct buttons */}
        <div className="hidden md:block">
          {isOwner ? (
            <button
              onClick={onDeleteSquad}
              className="w-full py-3 text-md text-error hover:text-error/70 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer la squad
            </button>
          ) : (
            <button
              onClick={onLeaveSquad}
              className="w-full py-3 text-md text-error hover:text-error/70 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Quitter la squad
            </button>
          )}
        </div>
        {/* Mobile: open drawer */}
        <button
          onClick={onOpenActionsDrawer}
          className="md:hidden w-full py-3 text-md text-text-tertiary hover:text-text-primary transition-colors flex items-center justify-center gap-2 border border-border-subtle rounded-xl"
        >
          Actions de la squad
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Actions Drawer */}
      <Drawer isOpen={showActionsDrawer} onClose={onCloseActionsDrawer} title="Actions">
        <div className="space-y-2">
          <button
            onClick={() => {
              onInviteClick()
              onCloseActionsDrawer()
            }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors"
          >
            <UserPlus className="w-5 h-5 text-primary" />
            <span className="text-md text-text-primary">Inviter des joueurs</span>
          </button>
          <button
            onClick={() => {
              onCreateSessionClick()
              onCloseActionsDrawer()
            }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors"
          >
            <Calendar className="w-5 h-5 text-warning" />
            <span className="text-md text-text-primary">Créer une session</span>
          </button>
          <button
            onClick={() => {
              navigate(`/messages?squad=${squadId}`)
              onCloseActionsDrawer()
            }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-success" />
            <span className="text-md text-text-primary">Chat de la squad</span>
          </button>
          {isOwner && onEditSquadClick && (
            <button
              onClick={() => {
                onEditSquadClick()
                onCloseActionsDrawer()
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors"
            >
              <Settings className="w-5 h-5 text-text-secondary" />
              <span className="text-md text-text-primary">Modifier la squad</span>
            </button>
          )}
          <div className="border-t border-border-subtle pt-2 mt-2">
            {isOwner ? (
              <button
                onClick={() => {
                  onDeleteSquad()
                  onCloseActionsDrawer()
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-error/5 transition-colors"
              >
                <Trash2 className="w-5 h-5 text-error" />
                <span className="text-md text-error">Supprimer la squad</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onLeaveSquad()
                  onCloseActionsDrawer()
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-error/5 transition-colors"
              >
                <LogOut className="w-5 h-5 text-error" />
                <span className="text-md text-error">Quitter la squad</span>
              </button>
            )}
          </div>
        </div>
      </Drawer>
    </>
  )
}
