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
  const title = 'Squad Planner - Le Calendly du gaming'
  const description =
    'Crée ta squad, planifie tes sessions avec confirmation de présence et fiabilité mesurée. Fini les « on verra ». Gratuit.'
  return [
    { title },
    { name: 'description', content: description },
    { name: 'robots', content: 'index, follow' },
    { tagName: 'link', rel: 'canonical', href: 'https://squadplanner.fr/' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://squadplanner.fr/' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: 'https://squadplanner.fr/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: 'https://squadplanner.fr/og-image.png' },
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
