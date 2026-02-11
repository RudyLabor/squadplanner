import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { Onboarding } from '../pages/Onboarding'

export function meta() {
  return [
    { title: "Bienvenue - Squad Planner" },
    { tagName: "link", rel: "canonical", href: "https://squadplanner.fr/onboarding" },
    { property: "og:url", content: "https://squadplanner.fr/onboarding" },
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
  return <Onboarding />
}
