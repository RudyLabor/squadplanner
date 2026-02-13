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
  const { count: msgCount } = await admin.from('messages').delete({ count: 'exact' }).ilike('content', '%[E2E]%')
  if (msgCount) console.log(`  Deleted ${msgCount} test messages`)

  // Delete orphan test sessions (cascade deletes rsvps/checkins)
  const { count: sessCount } = await admin.from('sessions').delete({ count: 'exact' }).ilike('title', '%E2E Test%')
  if (sessCount) console.log(`  Deleted ${sessCount} test sessions`)

  // Delete orphan test squads (cascade deletes members)
  const { count: squadCount } = await admin.from('squads').delete({ count: 'exact' }).ilike('name', '%E2E Test%')
  if (squadCount) console.log(`  Deleted ${squadCount} test squads`)

  console.log('[global-teardown] Done.')
}
