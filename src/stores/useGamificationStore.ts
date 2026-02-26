import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── XP thresholds per level ──────────────────────────────────────
const LEVEL_THRESHOLDS = [
  0, // Level 1
  100, // Level 2
  250, // Level 3
  500, // Level 4
  850, // Level 5
  1300, // Level 6
  1900, // Level 7
  2600, // Level 8
  3500, // Level 9
  4600, // Level 10
  6000, // Level 11
  7700, // Level 12
  9800, // Level 13
  12300, // Level 14
  15300, // Level 15
  18800, // Level 16
  23000, // Level 17
  28000, // Level 18
  34000, // Level 19
  41000, // Level 20 (max)
]

// ── XP rewards per action ────────────────────────────────────────
export const XP_REWARDS = {
  'session.create': 25,
  'session.rsvp': 15,
  'session.attend': 30,
  'session.complete': 20,
  'squad.create': 50,
  'squad.join': 20,
  'squad.invite': 10,
  'message.send': 2,
  'message.first_of_day': 10,
  'voice.join': 15,
  'voice.10min': 25,
  'profile.complete': 50,
  'profile.avatar': 20,
  'streak.day': 15,
  'streak.week': 50,
  'referral.success': 100,
  'discover.browse': 5,
  'invite.send': 5, // PHASE 5: XP for sending party invites
} as const

export type XPAction = keyof typeof XP_REWARDS

// ── Achievement definitions ──────────────────────────────────────
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: (stats: GamificationStats) => boolean
  xpBonus: number
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-session',
    name: 'Première session',
    description: 'Crée ta première session de jeu',
    icon: '🎮',
    condition: (s) => s.sessionsCreated >= 1,
    xpBonus: 50,
  },
  {
    id: 'squad-leader',
    name: 'Leader né',
    description: 'Crée 3 squads',
    icon: '👑',
    condition: (s) => s.squadsCreated >= 3,
    xpBonus: 100,
  },
  {
    id: 'social-butterfly',
    name: 'Papillon social',
    description: 'Envoie 100 messages',
    icon: '🦋',
    condition: (s) => s.messagesSent >= 100,
    xpBonus: 75,
  },
  {
    id: 'night-owl',
    name: 'Oiseau de nuit',
    description: 'Participe à 5 sessions après 22h',
    icon: '🦉',
    condition: (s) => s.nightSessions >= 5,
    xpBonus: 60,
  },
  {
    id: 'reliable',
    name: 'Fiable à 100%',
    description: 'Participe à 10 sessions consécutives confirmées',
    icon: '💎',
    condition: (s) => s.consecutiveAttended >= 10,
    xpBonus: 150,
  },
  {
    id: 'voice-veteran',
    name: 'Vétéran vocal',
    description: 'Passe 5h en appel vocal',
    icon: '🎙️',
    condition: (s) => s.voiceMinutes >= 300,
    xpBonus: 100,
  },
  {
    id: 'week-warrior',
    name: 'Guerrier de la semaine',
    description: 'Joue 7 jours consécutifs',
    icon: '⚔️',
    condition: (s) => s.currentStreak >= 7,
    xpBonus: 75,
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Atteins le niveau 10',
    icon: '🏛️',
    condition: (s) => s.level >= 10,
    xpBonus: 200,
  },
  {
    id: 'ambassador',
    name: 'Ambassadeur',
    description: 'Invite 5 amis qui rejoignent',
    icon: '🌟',
    condition: (s) => s.referrals >= 5,
    xpBonus: 250,
  },
  {
    id: 'marathon',
    name: 'Marathonien',
    description: 'Participe à 50 sessions',
    icon: '🏃',
    condition: (s) => s.sessionsAttended >= 50,
    xpBonus: 200,
  },
]

// ── Stats tracking ───────────────────────────────────────────────
export interface GamificationStats {
  sessionsCreated: number
  sessionsAttended: number
  squadsCreated: number
  squadsJoined: number
  messagesSent: number
  voiceMinutes: number
  nightSessions: number
  consecutiveAttended: number
  currentStreak: number
  bestStreak: number
  referrals: number
  invitesSent: number // PHASE 5: Track party invites sent
  level: number
}

// ── Store ────────────────────────────────────────────────────────
interface GamificationState {
  xp: number
  level: number
  stats: GamificationStats
  unlockedAchievements: string[]
  pendingLevelUp: { from: number; to: number } | null
  pendingAchievement: Achievement | null

  // Actions
  addXP: (action: XPAction) => void
  incrementStat: (stat: keyof GamificationStats, amount?: number) => void
  dismissLevelUp: () => void
  dismissAchievement: () => void
  getProgress: () => { current: number; needed: number; percent: number }
  getLevelTitle: () => string
  /** Sync store with Supabase profile data (xp, level) so UI matches DB */
  syncFromDB: (profile: { xp?: number | null; level?: number | null }) => void
}

function computeLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

const LEVEL_TITLES = [
  'Recrue', // 1
  'Soldat', // 2
  'Caporal', // 3
  'Sergent', // 4
  'Lieutenant', // 5
  'Capitaine', // 6
  'Commandant', // 7
  'Colonel', // 8
  'Général', // 9
  'Maréchal', // 10
  'Légende', // 11
  'Mythique', // 12
  'Immortel', // 13
  'Divin', // 14
  'Transcendant', // 15
  'Cosmique', // 16
  'Éternel', // 17
  'Absolu', // 18
  'Suprême', // 19
  'Ultime', // 20
]

interface GamificationStateWithHydration extends GamificationState {
  _isHydrated: boolean
}

export const useGamificationStore = create<GamificationStateWithHydration>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      _isHydrated: false,
      stats: {
        sessionsCreated: 0,
        sessionsAttended: 0,
        squadsCreated: 0,
        squadsJoined: 0,
        messagesSent: 0,
        voiceMinutes: 0,
        nightSessions: 0,
        consecutiveAttended: 0,
        currentStreak: 0,
        bestStreak: 0,
        referrals: 0,
        invitesSent: 0,
        level: 1,
      },
      unlockedAchievements: [],
      pendingLevelUp: null,
      pendingAchievement: null,

      addXP: (action) => {
        const reward = XP_REWARDS[action]
        if (!reward) return

        set((state) => {
          const newXP = state.xp + reward
          const newLevel = computeLevel(newXP)
          const leveledUp = newLevel > state.level

          // Check for new achievements
          const newStats = { ...state.stats, level: newLevel }
          let newAchievement: Achievement | null = null
          const newUnlocked = [...state.unlockedAchievements]

          for (const ach of ACHIEVEMENTS) {
            if (!newUnlocked.includes(ach.id) && ach.condition(newStats)) {
              newUnlocked.push(ach.id)
              newAchievement = ach
              // Only show the first new achievement
              break
            }
          }

          return {
            xp: newXP + (newAchievement?.xpBonus || 0),
            level: newLevel,
            stats: newStats,
            unlockedAchievements: newUnlocked,
            pendingLevelUp: leveledUp ? { from: state.level, to: newLevel } : state.pendingLevelUp,
            pendingAchievement: newAchievement || state.pendingAchievement,
          }
        })
      },

      incrementStat: (stat, amount = 1) => {
        set((state) => {
          const newStats = { ...state.stats }
          ;(newStats[stat] as number) += amount
          if (stat === 'currentStreak' && newStats.currentStreak > newStats.bestStreak) {
            newStats.bestStreak = newStats.currentStreak
          }
          return { stats: newStats }
        })
      },

      dismissLevelUp: () => set({ pendingLevelUp: null }),
      dismissAchievement: () => set({ pendingAchievement: null }),

      getProgress: () => {
        const { xp, level } = get()
        const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0
        const nextThreshold =
          LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
        const current = xp - currentThreshold
        const needed = nextThreshold - currentThreshold
        return {
          current,
          needed,
          percent: needed > 0 ? Math.min((current / needed) * 100, 100) : 100,
        }
      },

      getLevelTitle: () => {
        const { level } = get()
        return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]
      },

      syncFromDB: (profile) => {
        const dbXP = profile?.xp ?? 0
        const dbLevel = profile?.level ?? 1
        const { xp: storeXP, level: storeLevel } = get()
        // Only update if DB values are higher (DB is source of truth)
        // or if store is at defaults (never synced)
        if (dbXP > storeXP || (storeXP === 0 && dbXP >= 0)) {
          set({
            xp: dbXP,
            level: dbLevel > 0 ? dbLevel : computeLevel(dbXP),
            stats: { ...get().stats, level: dbLevel > 0 ? dbLevel : computeLevel(dbXP) },
          })
        }
      },
    }),
    {
      name: 'squadplanner-gamification',
      onRehydrateStorage: () => (state, error) => {
        if (state && !error) {
          // Mark store as hydrated after persist middleware rehydrates from localStorage
          state._isHydrated = true
        }
      },
    }
  )
)
