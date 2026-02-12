import { lazy, Suspense } from 'react'
import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createSupabaseServerClient } from '../lib/supabase.server'
import { queryKeys } from '../lib/queryClient'
import { ClientRouteWrapper } from '../components/ClientRouteWrapper'

const Profile = lazy(() => import('../pages/Profile').then(m => ({ default: m.Profile })))

export function meta() {
  return [
    { title: "Mon Profil - Squad Planner" },
    { name: "description", content: "Consulte ton profil gaming : statistiques, fiabilité, XP et badges. Personnalise ton identité Squad Planner." },
    { tagName: "link", rel: "canonical", href: "https://squadplanner.fr/profile" },
    { property: "og:url", content: "https://squadplanner.fr/profile" },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createSupabaseServerClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw redirect('/', { headers })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data({ profile }, { headers })
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders
}

import type { Profile as ProfileType } from '../types/database'

interface ProfileLoaderData {
  profile: ProfileType | null
}

export default function Component({ loaderData }: { loaderData: ProfileLoaderData }) {
  return (
    <ClientRouteWrapper seeds={[
      { key: queryKeys.profile.current(), data: loaderData?.profile },
    ]}>
      <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
        <Profile />
      </Suspense>
    </ClientRouteWrapper>
  )
}
