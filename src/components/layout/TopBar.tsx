import { memo, useCallback } from 'react'
import { Search } from 'lucide-react'
import { Breadcrumbs } from './Breadcrumbs'
import { GlobalSearch } from '../GlobalSearch'
import { NotificationBell } from '../NotificationCenter'

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

export const TopBar = memo(function TopBar() {
  return (
    <>
      {/* Desktop top bar */}
      <header role="banner" className="hidden lg:flex pt-4 px-6 items-center justify-between">
        <Breadcrumbs />
        <div className="flex items-center gap-2">
          <NotificationBell />
          <GlobalSearch />
        </div>
      </header>

      {/* Mobile top bar - search + notifications */}
      <header role="banner" className="lg:hidden flex items-center justify-end gap-2 px-4 pt-3 pb-1">
        <MobileSearchButton />
        <NotificationBell />
      </header>
    </>
  )
})
