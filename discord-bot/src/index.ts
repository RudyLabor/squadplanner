import 'dotenv/config'
import { Client, Collection, GatewayIntentBits } from 'discord.js'
import express from 'express'
import { loadCommands } from './commands/loader.js'
import { loadEvents } from './events/loader.js'
import { stripe, handleBotWebhookEvent } from './lib/stripe.js'
import type { BotCommand } from './types.js'

// Validate required env vars
const REQUIRED_VARS = [
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
]

for (const v of REQUIRED_VARS) {
  if (!process.env[v]) {
    console.error(`Missing required env var: ${v}`)
    process.exit(1)
  }
}

// Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
})
client.commands = new Collection<string, BotCommand>()

// Load commands and events
loadCommands(client)
loadEvents(client)

// Express server for Stripe webhook + health check
const app = express()

app.post(
  '/webhook/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string | undefined
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET_BOT) {
      res.status(400).send('Missing signature')
      return
    }
    try {
      const event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET_BOT,
      )
      await handleBotWebhookEvent(event)
      res.json({ received: true })
    } catch (err) {
      console.error('[Webhook Error]', err)
      res.status(400).send('Webhook error')
    }
  },
)

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    guilds: client.guilds.cache.size,
    uptime: process.uptime(),
  })
})

// Start bot + HTTP server
async function main() {
  const port = process.env.PORT || 3001

  await client.login(process.env.DISCORD_TOKEN)

  app.listen(port, () => {
    console.log(`[HTTP] Webhook server ready on port ${port}`)
  })
}

main().catch((err) => {
  console.error('Fatal error starting bot:', err)
  process.exit(1)
})
