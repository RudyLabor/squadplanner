import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createMinimalSSRClient } from '../lib/supabase-minimal-ssr'
import { queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'
import PublicProfile from '../pages/PublicProfile'

export function meta() {
  return [
    { title: 'Profil joueur - Squad Planner' },
    {
      name: 'description',
      content:
        "Profil public d'un joueur Squad Planner : statistiques, fiabilité et jeux préférés.",
    },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/profile' },
    { property: 'og:url', content: 'https://squadplanner.fr/profile' },
  ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { supabase, headers, getUser } = createMinimalSSRClient(request)
  const {
    data: { user },
    error,
  } = await getUser()

  if (error || !user) {
    return data({ profile: null }, { headers })
  }

  const username = params.username!

  // Fetch the public profile by username
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username as string)
    .single()

  return data({ profile, username }, { headers })
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

import type { Profile } from '../types/database'

interface PublicProfileLoaderData {
  profile: Profile | null
  username: string
}

export default function Component({ loaderData }: { loaderData: PublicProfileLoaderData }) {
  return (
    <ClientRouteWrapper
      seeds={[
        {
          key: [...queryKeys.discover.publicProfile(loaderData?.username)],
          data: loaderData?.profile,
        },
      ]}
    >
      <PublicProfile />
    </ClientRouteWrapper>
  )
}
