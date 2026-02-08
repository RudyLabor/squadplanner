import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

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

  // 404 fallback
  return 'Page non trouvée — Squad Planner'
}

export function useDocumentTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    const title = getTitleForPath(pathname)
    document.title = title

    // Announce route change to screen readers (A11Y 3)
    const ariaRegion = document.getElementById('aria-live-polite')
    if (ariaRegion) {
      ariaRegion.textContent = title.replace(' — Squad Planner', '')
    }
  }, [pathname])
}
