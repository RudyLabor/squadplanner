import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import {
  useGamificationStore,
  XP_REWARDS,
  ACHIEVEMENTS,
  type XPAction,
  type GamificationStats,
} from '../useGamificationStore'

describe('useGamificationStore', () => {
  beforeEach(() => {
    act(() => {
      useGamificationStore.setState({
        xp: 0,
        level: 1,
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
      })
    })
  })

  describe('XP_REWARDS', () => {
    it('session.create gives 25 XP', () => {
      expect(XP_REWARDS['session.create']).toBe(25)
    })

    it('referral.success gives 100 XP (highest non-bonus action)', () => {
      expect(XP_REWARDS['referral.success']).toBe(100)
    })

    it('message.send gives 2 XP (lowest action)', () => {
      expect(XP_REWARDS['message.send']).toBe(2)
    })

    it('all XP values are positive integers', () => {
      for (const [, value] of Object.entries(XP_REWARDS)) {
        expect(value).toBeGreaterThan(0)
        expect(Number.isInteger(value)).toBe(true)
      }
    })
  })

  describe('ACHIEVEMENTS', () => {
    it('contains 10 achievements', () => {
      expect(ACHIEVEMENTS).toHaveLength(10)
    })

    it('all achievements have unique IDs', () => {
      const ids = ACHIEVEMENTS.map((a) => a.id)
      expect(new Set(ids).size).toBe(ACHIEVEMENTS.length)
    })

    it('first-session unlocks at 1 session created', () => {
      const ach = ACHIEVEMENTS.find((a) => a.id === 'first-session')!
      const stats = { sessionsCreated: 1 } as GamificationStats
      expect(ach.condition(stats)).toBe(true)
      expect(ach.condition({ sessionsCreated: 0 } as GamificationStats)).toBe(false)
    })

    it('social-butterfly unlocks at 100 messages', () => {
      const ach = ACHIEVEMENTS.find((a) => a.id === 'social-butterfly')!
      expect(ach.condition({ messagesSent: 100 } as GamificationStats)).toBe(true)
      expect(ach.condition({ messagesSent: 99 } as GamificationStats)).toBe(false)
    })

    it('reliable unlocks at 10 consecutive attended', () => {
      const ach = ACHIEVEMENTS.find((a) => a.id === 'reliable')!
      expect(ach.condition({ consecutiveAttended: 10 } as GamificationStats)).toBe(true)
      expect(ach.condition({ consecutiveAttended: 9 } as GamificationStats)).toBe(false)
    })

    it('centurion unlocks at level 10', () => {
      const ach = ACHIEVEMENTS.find((a) => a.id === 'centurion')!
      expect(ach.condition({ level: 10 } as GamificationStats)).toBe(true)
      expect(ach.condition({ level: 9 } as GamificationStats)).toBe(false)
    })

    it('marathon unlocks at 50 sessions attended', () => {
      const ach = ACHIEVEMENTS.find((a) => a.id === 'marathon')!
      expect(ach.condition({ sessionsAttended: 50 } as GamificationStats)).toBe(true)
      expect(ach.condition({ sessionsAttended: 49 } as GamificationStats)).toBe(false)
    })

    it('all achievements have positive xpBonus', () => {
      for (const ach of ACHIEVEMENTS) {
        expect(ach.xpBonus).toBeGreaterThan(0)
      }
    })
  })

  describe('addXP', () => {
    it('increases XP by the correct amount for session.create', () => {
      act(() => {
        useGamificationStore.getState().addXP('session.create')
      })
      expect(useGamificationStore.getState().xp).toBe(25)
    })

    it('increases XP by the correct amount for message.send', () => {
      act(() => {
        useGamificationStore.getState().addXP('message.send')
      })
      expect(useGamificationStore.getState().xp).toBe(2)
    })

    it('accumulates XP across multiple actions', () => {
      act(() => {
        useGamificationStore.getState().addXP('session.create') // 25
        useGamificationStore.getState().addXP('session.rsvp') // 15
        useGamificationStore.getState().addXP('message.send') // 2
      })
      expect(useGamificationStore.getState().xp).toBe(42)
    })

    it('triggers level up when crossing threshold', () => {
      // Level 2 threshold is 100 XP
      act(() => {
        useGamificationStore.setState({ xp: 95 })
        useGamificationStore.getState().addXP('session.rsvp') // +15 = 110
      })
      expect(useGamificationStore.getState().level).toBe(2)
      expect(useGamificationStore.getState().pendingLevelUp).toEqual({ from: 1, to: 2 })
    })

    it('does not trigger level up when staying in same level', () => {
      act(() => {
        useGamificationStore.getState().addXP('message.send') // +2
      })
      expect(useGamificationStore.getState().level).toBe(1)
      expect(useGamificationStore.getState().pendingLevelUp).toBeNull()
    })

    it('can reach level 20 at 41000 XP', () => {
      act(() => {
        useGamificationStore.setState({ xp: 40999, level: 19 })
        useGamificationStore.getState().addXP('message.send') // +2 = 41001
      })
      expect(useGamificationStore.getState().level).toBe(20)
    })

    it('unlocks achievement when conditions are met', () => {
      act(() => {
        useGamificationStore.setState({
          stats: {
            ...useGamificationStore.getState().stats,
            sessionsCreated: 0,
          },
        })
      })
      // sessionsCreated is still 0, need to set it to 1 for condition
      act(() => {
        useGamificationStore.setState({
          stats: {
            ...useGamificationStore.getState().stats,
            sessionsCreated: 1,
          },
        })
        useGamificationStore.getState().addXP('session.create')
      })
      const state = useGamificationStore.getState()
      expect(state.unlockedAchievements).toContain('first-session')
      expect(state.pendingAchievement).not.toBeNull()
      expect(state.pendingAchievement!.id).toBe('first-session')
    })

    it('adds achievement xpBonus when unlocking', () => {
      act(() => {
        useGamificationStore.setState({
          stats: {
            ...useGamificationStore.getState().stats,
            sessionsCreated: 1,
          },
        })
        useGamificationStore.getState().addXP('session.create') // 25 + 50 bonus = 75
      })
      expect(useGamificationStore.getState().xp).toBe(75) // 25 action + 50 achievement
    })

    it('does not re-unlock already unlocked achievement', () => {
      act(() => {
        useGamificationStore.setState({
          stats: { ...useGamificationStore.getState().stats, sessionsCreated: 1 },
          unlockedAchievements: ['first-session'],
        })
        useGamificationStore.getState().addXP('session.create')
      })
      const state = useGamificationStore.getState()
      // Should only appear once
      expect(state.unlockedAchievements.filter((a) => a === 'first-session')).toHaveLength(1)
      expect(state.xp).toBe(25) // No bonus, already unlocked
    })
  })

  describe('incrementStat', () => {
    it('increments a stat by 1 by default', () => {
      act(() => {
        useGamificationStore.getState().incrementStat('sessionsCreated')
      })
      expect(useGamificationStore.getState().stats.sessionsCreated).toBe(1)
    })

    it('increments a stat by custom amount', () => {
      act(() => {
        useGamificationStore.getState().incrementStat('voiceMinutes', 30)
      })
      expect(useGamificationStore.getState().stats.voiceMinutes).toBe(30)
    })

    it('updates bestStreak when currentStreak exceeds it', () => {
      act(() => {
        useGamificationStore.setState({
          stats: { ...useGamificationStore.getState().stats, currentStreak: 5, bestStreak: 5 },
        })
        useGamificationStore.getState().incrementStat('currentStreak')
      })
      const stats = useGamificationStore.getState().stats
      expect(stats.currentStreak).toBe(6)
      expect(stats.bestStreak).toBe(6)
    })

    it('does not update bestStreak when currentStreak is lower', () => {
      act(() => {
        useGamificationStore.setState({
          stats: { ...useGamificationStore.getState().stats, currentStreak: 2, bestStreak: 10 },
        })
        useGamificationStore.getState().incrementStat('currentStreak')
      })
      const stats = useGamificationStore.getState().stats
      expect(stats.currentStreak).toBe(3)
      expect(stats.bestStreak).toBe(10)
    })
  })

  describe('dismissLevelUp', () => {
    it('clears pendingLevelUp', () => {
      act(() => {
        useGamificationStore.setState({ pendingLevelUp: { from: 1, to: 2 } })
        useGamificationStore.getState().dismissLevelUp()
      })
      expect(useGamificationStore.getState().pendingLevelUp).toBeNull()
    })
  })

  describe('dismissAchievement', () => {
    it('clears pendingAchievement', () => {
      act(() => {
        useGamificationStore.setState({ pendingAchievement: ACHIEVEMENTS[0] })
        useGamificationStore.getState().dismissAchievement()
      })
      expect(useGamificationStore.getState().pendingAchievement).toBeNull()
    })
  })

  describe('getProgress', () => {
    it('returns correct progress at start', () => {
      const progress = useGamificationStore.getState().getProgress()
      expect(progress.current).toBe(0)
      expect(progress.needed).toBe(100) // Level 2 threshold - Level 1 threshold = 100 - 0
      expect(progress.percent).toBe(0)
    })

    it('returns correct progress mid-level', () => {
      act(() => {
        useGamificationStore.setState({ xp: 50, level: 1 })
      })
      const progress = useGamificationStore.getState().getProgress()
      expect(progress.current).toBe(50)
      expect(progress.needed).toBe(100)
      expect(progress.percent).toBe(50)
    })

    it('caps percent at 100', () => {
      act(() => {
        useGamificationStore.setState({ xp: 200, level: 1 })
      })
      const progress = useGamificationStore.getState().getProgress()
      expect(progress.percent).toBe(100)
    })

    it('calculates correctly at higher levels', () => {
      act(() => {
        useGamificationStore.setState({ xp: 600, level: 4 }) // Threshold 4=500, 5=850
      })
      const progress = useGamificationStore.getState().getProgress()
      expect(progress.current).toBe(100) // 600 - 500
      expect(progress.needed).toBe(350) // 850 - 500
      expect(progress.percent).toBeCloseTo(28.57, 1)
    })
  })

  describe('getLevelTitle', () => {
    it('returns "Recrue" for level 1', () => {
      expect(useGamificationStore.getState().getLevelTitle()).toBe('Recrue')
    })

    it('returns "Maréchal" for level 10', () => {
      act(() => {
        useGamificationStore.setState({ level: 10 })
      })
      expect(useGamificationStore.getState().getLevelTitle()).toBe('Maréchal')
    })

    it('returns "Ultime" for level 20', () => {
      act(() => {
        useGamificationStore.setState({ level: 20 })
      })
      expect(useGamificationStore.getState().getLevelTitle()).toBe('Ultime')
    })

    it('returns last title for levels beyond 20', () => {
      act(() => {
        useGamificationStore.setState({ level: 25 })
      })
      expect(useGamificationStore.getState().getLevelTitle()).toBe('Ultime')
    })
  })
})
