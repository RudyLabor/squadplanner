import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createSupabaseServerClient } from '../lib/supabase.server'

const CallHistory = lazy(() => import('../pages/CallHistory').then(m => ({ default: m.CallHistory })))

export function meta() {
  return [
    { title: "Historique d'appels - Squad Planner" },
    { tagName: "link", rel: "canonical", href: "https://squadplanner.fr/call-history" },
    { property: "og:url", content: "https://squadplanner.fr/call-history" },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createSupabaseServerClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw redirect('/', { headers })
  }

  return data({ userId: user.id }, { headers })
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

export default function Component() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <CallHistory />
    </Suspense>
  )
}
