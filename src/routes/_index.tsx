import type { HeadersArgs } from 'react-router'
import { Navigate, useSearchParams } from 'react-router'
import { useAuthStore } from '../hooks/useAuth'
import { faqs } from '../components/landing/FaqSection'

import Landing from '../pages/Landing'

export function headers(_args: HeadersArgs) {
  return {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export function meta() {
  return [
    { title: 'Squad Planner - Le Calendly du gaming' },
    {
      name: 'description',
      content:
        'Crée ta squad, planifie tes sessions avec RSVP et fiabilité mesurée. Fini les « on verra ». Gratuit.',
    },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/' },
    { property: 'og:url', content: 'https://squadplanner.fr/' },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    },
  ]
}

export default function LandingOrHome() {
  const { user, isInitialized } = useAuthStore()
  const [searchParams] = useSearchParams()
  const showPublic = searchParams.get('public') === 'true'

  // Redirect authenticated users to home (skip during SSR / before auth init)
  if (isInitialized && user && !showPublic) return <Navigate to="/home" replace />

  // Always render Landing — same component for SSR, hydration, and client.
  // Previous Suspense/lazy pattern caused mount→unmount→remount cycles
  // that broke useInView observers and framer-motion initial animations.
  return <Landing />
}
