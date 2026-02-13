import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { Onboarding } from '../pages/Onboarding'

export function meta() {
  return [
    { title: 'Bienvenue - Squad Planner' },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/onboarding' },
    { property: 'og:url', content: 'https://squadplanner.fr/onboarding' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers, getUser } = createMinimalSSRClient(request)
  const {
    data: { user },
    error,
  } = await getUser()

  if (error || !user) {
    return data({ userId: null }, { headers })
  }

  // If the user already has squads, skip onboarding entirely
  const { count } = await supabase
    .from('squad_members')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (count && count > 0) {
    throw redirect('/home', { headers })
  }

  return data({ userId: user.id }, { headers })
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

export default function Component() {
  return <Onboarding />
}
