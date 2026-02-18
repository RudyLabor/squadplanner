
import { memo, useCallback, useState } from 'react'
import { Link } from 'react-router'
import { Search, LayoutGrid, Compass, User, Settings, HelpCircle, Phone, Gift } from '../icons'
import { Breadcrumbs } from './Breadcrumbs'
import { GlobalSearch } from '../GlobalSearch'
import { NotificationBell } from '../NotificationCenter'
import { Sheet } from '../ui/Sheet'
import { Tooltip } from '../ui/Tooltip'

function MobileSearchButton() {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')

  const openSearch = useCallback(() => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: !isMac,
      metaKey: isMac,
      bubbles: true,
    })
    window.dispatchEvent(event)
  }, [isMac])

  return (
    <button
      onClick={openSearch}
      className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center hover:bg-border-hover transition-colors"
      aria-label="Rechercher"
    >
      <Search className="w-5 h-5 text-text-secondary" />
    </button>
  )
}

// Items not in the bottom nav — same order as desktop sidebar
const moreMenuItems = [
  { path: '/discover', icon: Compass, label: 'Découvrir' },
  { path: '/profile', icon: User, label: 'Profil' },
  { path: '/settings', icon: Settings, label: 'Paramètres' },
  { path: '/help', icon: HelpCircle, label: 'Aide' },
  { path: '/call-history', icon: Phone, label: 'Appels' },
  { path: '/referrals', icon: Gift, label: 'Parrainage' },
] as const

export const TopBar = memo(function TopBar() {
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  return (
    <>
      {/* Desktop top bar */}
      <header role="banner" className="desktop-only pt-4 px-6 items-center justify-between">
        <Breadcrumbs />
        <div className="flex items-center gap-2">
          <Tooltip content="Notifications" position="left">
            <NotificationBell />
          </Tooltip>
          <Tooltip content="Rechercher (Ctrl+K)" position="bottom">
            <GlobalSearch />
          </Tooltip>
        </div>
      </header>

      {/* Mobile top bar - search + notifications (safe-area-pt for Dynamic Island / notch) */}
      <header role="banner" className="mobile-only items-center justify-end gap-2 px-4 pt-3 pb-1 safe-area-pt">
        <button
          onClick={() => setShowMoreMenu(true)}
          className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center hover:bg-border-hover transition-colors"
          aria-label="Plus de pages"
        >
          <LayoutGrid className="w-5 h-5 text-text-secondary" />
        </button>
        <MobileSearchButton />
        <NotificationBell />
      </header>

      {/* More menu sheet */}
      <Sheet
        open={showMoreMenu}
        onClose={() => setShowMoreMenu(false)}
        title="Navigation"
        side="bottom"
      >
        <nav className="grid grid-cols-3 gap-4 py-2">
          {moreMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setShowMoreMenu(false)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-bg-hover transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-card flex items-center justify-center">
                <item.icon className="w-6 h-6 text-text-secondary" />
              </div>
              <span className="text-sm text-text-secondary">{item.label}</span>
            </Link>
          ))}
        </nav>
      </Sheet>
    </>
  )
})
