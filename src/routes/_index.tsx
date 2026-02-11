import type { HeadersArgs } from 'react-router'
import { Navigate, useSearchParams } from 'react-router'
import { useAuthStore } from '../hooks/useAuth'
import Landing from '../pages/Landing'
import { faqs } from '../components/landing/FaqSection'

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function headers(_args: HeadersArgs) {
  return {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  }
}

export function meta() {
  return [
    { title: "Squad Planner - Le Calendly du gaming" },
    { name: "description", content: "Crée ta squad, planifie tes sessions avec RSVP et fiabilité mesurée. Fini les « on verra ». Gratuit." },
    { tagName: "link", rel: "canonical", href: "https://squadplanner.fr/" },
    { property: "og:url", content: "https://squadplanner.fr/" },
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(f => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a }
        }))
      }
    }
  ]
}

export default function LandingOrHome() {
  const { user, isInitialized } = useAuthStore()
  const [searchParams] = useSearchParams()

  // During SSR, always render Landing (server doesn't know auth state)
  if (typeof window === 'undefined') return <Landing />

  const showPublic = searchParams.get('public') === 'true'

  if (!isInitialized) return <LoadingSpinner />
  if (user && !showPublic) return <Navigate to="/home" replace />
  return <Landing />
}
