import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000, 20000]

export async function updateDailyStreak(
  userId: string,
  profile: Profile | null
): Promise<Profile | null> {
  if (!profile) return null

  const today = new Date().toISOString().split('T')[0]
  const lastDate = profile.streak_last_date

  if (lastDate === today) return profile

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreakDays = 1
  let xpBonus = 10

  if (lastDate === yesterdayStr) {
    newStreakDays = (profile.streak_days || 0) + 1
    if (newStreakDays === 7) xpBonus = 100
    else if (newStreakDays === 14) xpBonus = 200
    else if (newStreakDays === 30) xpBonus = 500
    else if (newStreakDays === 100) xpBonus = 1000
    else if (newStreakDays % 7 === 0) xpBonus = 50
  }

  const newXP = (profile.xp || 0) + xpBonus
  let newLevel = 1
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (newXP >= LEVEL_THRESHOLDS[i]) {
      newLevel = i + 1
      break
    }
  }

  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update({ streak_days: newStreakDays, streak_last_date: today, xp: newXP, level: newLevel })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.warn('Failed to update streak:', error)
    return profile
  }

  console.log(`Daily streak updated: Day ${newStreakDays}, +${xpBonus} XP`)
  return updatedProfile || profile
}
