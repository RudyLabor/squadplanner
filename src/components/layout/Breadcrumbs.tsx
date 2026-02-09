import { ChevronRight, Home } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useSquadsStore, useSessionsStore } from '../../hooks'

interface BreadcrumbItem {
  label: string
  path?: string
}

// Capitalize first letter of a string
function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Route config for breadcrumbs
const routeLabels: Record<string, string> = {
  '/home': 'Accueil',
  '/squads': 'Squads',
  '/party': 'Party',
  '/messages': 'Messages',
  '/profile': 'Profil',
  '/sessions': 'Sessions',
  '/settings': 'Paramètres',
  '/premium': 'Premium',
  '/call-history': 'Historique appels',
}

export function Breadcrumbs() {
  const location = useLocation()
  const { currentSquad } = useSquadsStore()
  const { currentSession } = useSessionsStore()

  // Don't show on home or landing
  if (location.pathname === '/' || location.pathname === '/home') {
    return null
  }

  // Build breadcrumb trail
  const items: BreadcrumbItem[] = [
    { label: 'Accueil', path: '/home' }
  ]

  const pathParts = location.pathname.split('/').filter(Boolean)

  // Handle different routes
  if (pathParts[0] === 'squad' && pathParts[1]) {
    items.push({ label: 'Squads', path: '/squads' })
    items.push({ label: currentSquad?.name || 'Squad' })
  } else if (pathParts[0] === 'session' && pathParts[1]) {
    items.push({ label: 'Sessions', path: '/sessions' })
    items.push({ label: currentSession?.title || 'Session' })
  } else if (pathParts[0] === 'call-history') {
    items.push({ label: 'Profil', path: '/profile' })
    items.push({ label: 'Historique appels' })
  } else if (pathParts[0] === 'settings') {
    items.push({ label: 'Profil', path: '/profile' })
    items.push({ label: 'Paramètres' })
  } else {
    // Simple route - capitalize unknown segments
    const label = routeLabels[location.pathname] || capitalize(pathParts[0])
    items.push({ label })
  }

  // Only show if we have more than just home
  if (items.length <= 1) {
    return null
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="hidden lg:flex items-center gap-2 text-[13px] mb-4 px-4 md:px-6 lg:px-8"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={index} className="flex items-center gap-2">
            {index === 0 && (
              <Home className="w-3.5 h-3.5 text-text-tertiary" />
            )}

            {item.path && !isLast ? (
              <Link
                to={item.path}
                className="text-text-secondary hover:text-text-primary transition-colors duration-300"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-text-primary font-medium' : 'text-text-secondary'}>
                {item.label}
              </span>
            )}

            {!isLast && (
              <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default Breadcrumbs
