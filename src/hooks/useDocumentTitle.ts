import { useEffect } from 'react'
import { useLocation } from 'react-router'

const pageTitles: Record<string, string> = {
  '/': 'Squad Planner — Le Calendly du gaming',
  '/home': 'Accueil — Squad Planner',
  '/squads': 'Mes Squads — Squad Planner',
  '/party': 'Party Vocale — Squad Planner',
  '/messages': 'Messages — Squad Planner',
  '/sessions': 'Sessions — Squad Planner',
  '/profile': 'Profil — Squad Planner',
  '/settings': 'Paramètres — Squad Planner',
  '/premium': 'Premium — Squad Planner',
  '/help': 'Aide & FAQ — Squad Planner',
  '/call-history': 'Historique Appels — Squad Planner',
  '/discover': 'Découvrir — Squad Planner',
  '/referrals': 'Parrainage — Squad Planner',
  '/auth': 'Connexion — Squad Planner',
  '/onboarding': 'Bienvenue — Squad Planner',
  '/legal': "Conditions d'utilisation — Squad Planner",
}

function getTitleForPath(pathname: string): string {
  // Exact match first
  if (pageTitles[pathname]) return pageTitles[pathname]

  // Dynamic routes
  if (pathname.startsWith('/squad/')) return 'Squad — Squad Planner'
  if (pathname.startsWith('/session/')) return 'Session — Squad Planner'
  if (pathname.startsWith('/join/')) return 'Rejoindre — Squad Planner'
  if (pathname.startsWith('/u/')) {
    const username = pathname.split('/')[2]
    return username ? `${username} — Profil — Squad Planner` : 'Profil joueur — Squad Planner'
  }

  // 404 fallback
  return 'Page non trouvée — Squad Planner'
}

export function useDocumentTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    const title = getTitleForPath(pathname)
    document.title = title

    // Update canonical URL dynamically
    const canonicalUrl = `https://squadplanner.fr${pathname === '/' ? '' : pathname}`
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (canonical) canonical.href = canonicalUrl

    // Update og:url
    const ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement
    if (ogUrl) ogUrl.content = canonicalUrl

    // Update twitter:url
    const twitterUrl = document.querySelector('meta[name="twitter:url"]') as HTMLMetaElement
    if (twitterUrl) twitterUrl.content = canonicalUrl

    // Announce route change to screen readers (A11Y 3)
    const ariaRegion = document.getElementById('aria-live-polite')
    if (ariaRegion) {
      ariaRegion.textContent = title.replace(' — Squad Planner', '')
    }
  }, [pathname])
}
