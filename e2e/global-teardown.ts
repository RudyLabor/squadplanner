import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

export default async function globalTeardown() {
  dotenv.config({ path: resolve(process.cwd(), '.env') })

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nxbqiwmfyafgshxzczxo.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseServiceKey) {
    console.log('[global-teardown] No service role key — skipping cleanup')
    return
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('[global-teardown] Cleaning up E2E test data...')

  // Delete orphan test messages
  const { count: msgCount } = await admin
    .from('messages')
    .delete({ count: 'exact' })
    .ilike('content', '%[E2E]%')
  if (msgCount) console.log(`  Deleted ${msgCount} test messages`)

  // Delete orphan test sessions (cascade deletes rsvps/checkins)
  const { count: sessCount } = await admin
    .from('sessions')
    .delete({ count: 'exact' })
    .ilike('title', '%E2E Test%')
  if (sessCount) console.log(`  Deleted ${sessCount} test sessions`)

  // Delete orphan test squads (cascade deletes members)
  const { count: squadCount } = await admin
    .from('squads')
    .delete({ count: 'exact' })
    .ilike('name', '%E2E Test%')
  if (squadCount) console.log(`  Deleted ${squadCount} test squads`)

  // Delete temporary E2E test users (created by GDPR delete tests)
  try {
    const { data: usersData } = await admin.auth.admin.listUsers()
    const e2eTempUsers =
      usersData?.users?.filter(
        (u: { email?: string }) =>
          u.email?.startsWith('e2e-delete-test-') || u.email?.startsWith('e2e-temp-')
      ) || []
    if (e2eTempUsers.length > 0) {
      for (const user of e2eTempUsers) {
        const tables = [
          'session_checkins',
          'session_rsvps',
          'messages',
          'direct_messages',
          'party_participants',
          'push_subscriptions',
          'squad_members',
          'ai_insights',
          'profiles',
        ]
        for (const table of tables) {
          const col =
            table === 'profiles' ? 'id' : table === 'direct_messages' ? 'sender_id' : 'user_id'
          await admin.from(table).delete().eq(col, user.id)
        }
        await admin.auth.admin.deleteUser(user.id)
      }
      console.log(`  Deleted ${e2eTempUsers.length} temporary test users`)
    }
  } catch (err) {
    console.log(`  Warning: temp user cleanup failed: ${err}`)
  }

  // Restore subscription tier to 'club' (the user's real plan — tests may have changed it)
  try {
    const { data: usersData2 } = await admin.auth.admin.listUsers()
    const testUser = usersData2?.users?.find(
      (u: { email?: string }) => u.email === 'rudylabor@hotmail.fr'
    )
    if (testUser) {
      await admin
        .from('profiles')
        .update({
          subscription_tier: 'club',
        })
        .eq('id', testUser.id)
    }
  } catch {
    /* ignore */
  }

  console.log('[global-teardown] Done.')
}
