import { memo } from 'react'
import { Breadcrumbs } from './Breadcrumbs'
import { GlobalSearch } from '../GlobalSearch'
import { NotificationBell } from '../NotificationCenter'

export const TopBar = memo(function TopBar() {
  return (
    <header role="banner" className="hidden lg:flex pt-4 px-6 items-center justify-between">
      <Breadcrumbs />
      <div className="flex items-center gap-2">
        <NotificationBell />
        <GlobalSearch />
      </div>
    </header>
  )
})
