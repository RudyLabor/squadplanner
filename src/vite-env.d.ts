/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string

  // Stripe
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_STRIPE_PRICE_MONTHLY: string
  readonly VITE_STRIPE_PRICE_YEARLY: string

  // Agora (Voice Chat)
  readonly VITE_AGORA_APP_ID: string

  // Web Push Notifications
  readonly VITE_VAPID_PUBLIC_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
