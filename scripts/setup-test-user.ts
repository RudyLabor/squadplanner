/**
 * Script to create a test user in Supabase for E2E testing
 * Run with: npx tsx scripts/setup-test-user.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const TEST_USER = {
  email: 'test@squadplanner.dev',
  password: 'TestPassword123!',
  username: 'testuser'
}

async function setupTestUser() {
  console.log('Setting up test user...')

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers?.users.find(u => u.email === TEST_USER.email)

  if (existingUser) {
    console.log('Test user already exists, updating password...')

    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { password: TEST_USER.password }
    )

    if (updateError) {
      console.error('Error updating user:', updateError.message)
      process.exit(1)
    }

    console.log('Test user password updated!')
    console.log(`Email: ${TEST_USER.email}`)
    console.log(`Password: ${TEST_USER.password}`)
    return
  }

  // Create the user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true // Auto-confirm email
  })

  if (authError) {
    console.error('Error creating user:', authError.message)
    process.exit(1)
  }

  if (!authData.user) {
    console.error('No user returned from createUser')
    process.exit(1)
  }

  console.log('Auth user created:', authData.user.id)

  // Create the profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      username: TEST_USER.username,
      reliability_score: 100,
      xp: 0,
      level: 1
    })

  if (profileError) {
    console.error('Error creating profile:', profileError.message)
    // Clean up auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id)
    process.exit(1)
  }

  console.log('Profile created!')

  // Create a test squad for the user
  const { data: squad, error: squadError } = await supabase
    .from('squads')
    .insert({
      name: 'Test Squad',
      game: 'Test Game',
      invite_code: 'TEST123',
      owner_id: authData.user.id
    })
    .select()
    .single()

  if (squadError) {
    console.error('Error creating squad:', squadError.message)
  } else {
    console.log('Test squad created:', squad.id)

    // Add user as member of the squad
    await supabase
      .from('squad_members')
      .insert({
        squad_id: squad.id,
        user_id: authData.user.id,
        role: 'owner'
      })
  }

  console.log('\n✅ Test user setup complete!')
  console.log(`Email: ${TEST_USER.email}`)
  console.log(`Password: ${TEST_USER.password}`)
  console.log(`Username: ${TEST_USER.username}`)
}

setupTestUser().catch(console.error)
