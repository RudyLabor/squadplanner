import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const pageTitles: Record<string, string> = {
  '/': 'Squad Planner — Le Calendly du gaming',
  '/premium': 'Premium — Squad Planner',
  '/help': 'Aide & FAQ — Squad Planner',
  '/legal': 'Conditions d\'utilisation — Squad Planner',
  '/auth': 'Connexion — Squad Planner',
}

const fallbackTitle = 'Squad Planner — Le Calendly du gaming'

export function useDocumentTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    const title = pageTitles[pathname] || fallbackTitle
    document.title = title
  }, [pathname])
}
