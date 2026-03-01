import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { Onboarding } from '../pages/Onboarding'

export function meta() {
  return [
    { title: 'Bienvenue - Squad Planner' },
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        'Configure ton compte Squad Planner : crée ou rejoins une squad, personnalise ton profil et active les notifications.',
    },
    { httpEquiv: 'content-language', content: 'fr' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Squad Planner' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Bienvenue - Squad Planner' },
    {
      property: 'og:description',
      content:
        'Configure ton compte Squad Planner : crée ou rejoins une squad, personnalise ton profil et active les notifications.',
    },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Bienvenue - Squad Planner' },
    {
      name: 'twitter:description',
      content:
        'Configure ton compte Squad Planner : crée ou rejoins une squad, personnalise ton profil et active les notifications.',
    },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
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
