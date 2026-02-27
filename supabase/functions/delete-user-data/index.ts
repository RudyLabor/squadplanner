// Delete User Data Edge Function
// Supprime toutes les données utilisateur (droit à l'oubli / GDPR)
// Annule l'abonnement Stripe si actif, puis supprime dans l'ordre FK.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

// CORS Security: Only allow specific origins
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://squadplanner.fr',
  'https://squadplanner.app',
  Deno.env.get('SUPABASE_URL') || '',
].filter(Boolean)

function getCorsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.some((allowed) => origin === allowed) ? origin : null
  if (!allowedOrigin) {
    return {
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req.headers.get('origin')) })
  }

  if (req.method === 'HEAD') {
    return new Response(null, { status: 200, headers: getCorsHeaders(req.headers.get('origin')) })
  }

  try {
    // Client authentifié (pour vérifier l'identité)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Client admin (pour supprimer l'utilisateur Auth et contourner le RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      })
    }

    const userId = user.id

    // Parse body optionnel (pour confirmation)
    let rawBody: Record<string, unknown> = {}
    try {
      rawBody = await req.json()
    } catch {
      // Body vide accepté
    }

    // Vérification de confirmation (sécurité supplémentaire)
    if (rawBody.confirm !== 'DELETE_MY_ACCOUNT') {
      return new Response(
        JSON.stringify({ error: 'Confirmation required: send { "confirm": "DELETE_MY_ACCOUNT" }' }),
        {
          status: 400,
          headers: {
            ...getCorsHeaders(req.headers.get('origin')),
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // 1. Annuler les abonnements Stripe actifs
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (subscriptions && subscriptions.length > 0) {
      for (const sub of subscriptions) {
        if (sub.stripe_subscription_id) {
          try {
            await stripe.subscriptions.cancel(sub.stripe_subscription_id)
          } catch (stripeErr) {
            console.error('Failed to cancel Stripe subscription:', stripeErr)
            // Continue meme si Stripe echoue - on veut quand meme supprimer les donnees
          }
        }
      }
    }

    // Annuler le customer Stripe si presente dans le profil
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profile?.stripe_customer_id) {
      try {
        await stripe.customers.del(profile.stripe_customer_id)
      } catch (stripeErr) {
        console.error('Failed to delete Stripe customer:', stripeErr)
      }
    }

    // 2. Supprimer les données dans l'ordre FK (enfants avant parents)
    // Utiliser le client admin pour contourner le RLS

    // session_rsvps (via user_id)
    await supabaseAdmin.from('session_rsvps').delete().eq('user_id', userId)

    // session_checkins (via user_id)
    await supabaseAdmin.from('session_checkins').delete().eq('user_id', userId)

    // messages (via sender_id)
    await supabaseAdmin.from('messages').delete().eq('sender_id', userId)

    // direct_messages (envoyées et reçues)
    await supabaseAdmin.from('direct_messages').delete().eq('sender_id', userId)
    await supabaseAdmin.from('direct_messages').delete().eq('receiver_id', userId)

    // push_tokens (via user_id)
    await supabaseAdmin.from('push_tokens').delete().eq('user_id', userId)

    // recurring_sessions (via created_by)
    await supabaseAdmin.from('recurring_sessions').delete().eq('created_by', userId)

    // squad_members (via user_id)
    await supabaseAdmin.from('squad_members').delete().eq('user_id', userId)

    // referrals (en tant que referrer et referred)
    await supabaseAdmin.from('referrals').delete().eq('referrer_id', userId)
    await supabaseAdmin.from('referrals').delete().eq('referred_id', userId)

    // ai_insights (via user_id)
    await supabaseAdmin.from('ai_insights').delete().eq('user_id', userId)

    // notification_preferences (via user_id)
    await supabaseAdmin.from('notification_preferences').delete().eq('user_id', userId)

    // subscriptions (via user_id)
    await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId)

    // squads dont l'utilisateur est owner (CASCADE supprimera les dependances)
    await supabaseAdmin.from('squads').delete().eq('owner_id', userId)

    // profiles (CASCADE devrait gérer le reste)
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    // 3. Supprimer l'utilisateur Supabase Auth
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      console.error('Failed to delete auth user:', deleteAuthError)
      // Les donnees sont deja supprimees, on retourne quand meme un succes partiel
      return new Response(
        JSON.stringify({
          success: true,
          warning: 'User data deleted but auth account removal failed. Contact support.',
        }),
        {
          headers: {
            ...getCorsHeaders(req.headers.get('origin')),
            'Content-Type': 'application/json',
          },
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All user data has been permanently deleted.',
        deleted_user_id: userId,
      }),
      {
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    // SEC: Don't leak internal error details to clients
    console.error('Error deleting user data:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        ...getCorsHeaders(req.headers.get('origin')),
        'Content-Type': 'application/json',
      },
    })
  }
})
