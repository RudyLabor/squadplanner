import { supabaseAdmin } from './supabase.js'

/** Cache server premium status to avoid constant DB queries */
const premiumCache = new Map<string, { isPremium: boolean; expiresAt: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function checkServerPremium(guildId: string): Promise<boolean> {
  const cached = premiumCache.get(guildId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.isPremium
  }

  const { data } = await supabaseAdmin
    .from('discord_server_subscriptions')
    .select('status, current_period_end')
    .eq('discord_guild_id', guildId)
    .single()

  let isPremium = false
  if (data?.status === 'premium') {
    const periodEnd = data.current_period_end ? new Date(data.current_period_end) : null
    isPremium = !periodEnd || periodEnd > new Date()
  }

  premiumCache.set(guildId, { isPremium, expiresAt: Date.now() + CACHE_TTL })
  return isPremium
}

export function invalidatePremiumCache(guildId: string) {
  premiumCache.delete(guildId)
}
