// Script to check if Supabase project is ready
const SUPABASE_URL = 'https://nxbqiwmfyafgshxzcxo.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YnFpd21meWFmZ3NoeHpjenhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjgzOTcsImV4cCI6MjA4NTc0NDM5N30.LON1PoWSXUsk4ytYTF3m1eQsfTP8mg1F9Cxac5yRTmw'

async function checkSupabase() {
  const maxRetries = 30
  const delayMs = 10000

  for (let i = 1; i <= maxRetries; i++) {
    console.log(`Attempt ${i}/${maxRetries}...`)
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        headers: { apikey: ANON_KEY }
      })

      if (response.ok) {
        console.log('✅ Supabase project is ready!')
        const data = await response.json()
        console.log('Response:', JSON.stringify(data).slice(0, 200) + '...')
        return true
      } else {
        console.log(`❌ Status: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }

    if (i < maxRetries) {
      console.log(`Waiting ${delayMs/1000}s before retry...`)
      await new Promise(r => setTimeout(r, delayMs))
    }
  }

  console.log('❌ Supabase project not ready after all retries')
  return false
}

checkSupabase()
