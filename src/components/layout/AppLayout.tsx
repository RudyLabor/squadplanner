"use client";

import { useEffect, useState, memo, useCallback, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import { m } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { useAuthStore, useSquadsStore, useKeyboardVisible, useUnreadCountStore, useSquadNotificationsStore, useGlobalPresence } from '../../hooks'
import { useCreateSessionModal } from '../CreateSessionModal'
import { CustomStatusModal } from '../CustomStatusModal'
import { DesktopSidebar } from './DesktopSidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { TopBar } from './TopBar'

interface AppLayoutProps {
  children: ReactNode
}

// Desktop content wrapper - handles responsive margin without duplicate rendering
const DesktopContentWrapper = memo(function DesktopContentWrapper({
  isExpanded,
  isKeyboardVisible,
  locationKey,
  children
}: {
  isExpanded: boolean
  isKeyboardVisible: boolean
  locationKey: string
  children: ReactNode
}) {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    // Desktop = wide screen + hover-capable (mouse/trackpad).
    // Touch-only devices (Galaxy Fold unfolded) keep mobile layout.
    const hoverQuery = window.matchMedia('(hover: hover)')
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024 && hoverQuery.matches)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    hoverQuery.addEventListener('change', checkDesktop)
    return () => {
      window.removeEventListener('resize', checkDesktop)
      hoverQuery.removeEventListener('change', checkDesktop)
    }
  }, [])

  const marginLeft = isDesktop ? (isExpanded ? 256 : 140) : 0

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide-mobile overscroll-contain ${isKeyboardVisible ? 'pb-0' : isDesktop ? 'pb-0' : 'pb-mobile-nav'}`}
    >
      <m.div
        initial={false}
        animate={{ marginLeft }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div key={locationKey} className="animate-page-in">
          {children}
        </div>
      </m.div>
    </main>
  )
})

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()

  // Determine early if nav is needed (landing, auth, onboarding skip nav entirely)
  const isAuthPage = location.pathname === '/auth'
  const isOnboarding = location.pathname === '/onboarding'
  const isLanding = location.pathname === '/'

  // OPTIMIZED: Use shallow selectors to prevent re-renders on unrelated state changes
  const { profile, user } = useAuthStore(useShallow(state => ({
    profile: state.profile,
    user: state.user
  })))

  const isPublicPage = ['/legal', '/help', '/premium'].includes(location.pathname)
  const shouldHideNav = isAuthPage || isOnboarding || isLanding || (isPublicPage && !user)

  useSquadsStore()

  // Lazy-load voice chat state to avoid pulling 675-line useVoiceChat module on landing
  const [isInVoiceChat, setIsInVoiceChat] = useState(false)
  useEffect(() => {
    if (shouldHideNav) return
    let unsub: (() => void) | undefined
    import('../../hooks/useVoiceChat').then(({ useVoiceChatStore }) => {
      setIsInVoiceChat(useVoiceChatStore.getState().isConnected)
      unsub = useVoiceChatStore.subscribe(
        state => state.isConnected,
        connected => setIsInVoiceChat(connected)
      )
    })
    return () => { unsub?.() }
  }, [shouldHideNav])

  const isKeyboardVisible = useKeyboardVisible()

  // PHASE 3.1: Create session modal
  const openCreateSessionModal = useCreateSessionModal(state => state.open)

  const { totalUnread: unreadMessages, fetchCounts, subscribe, unsubscribe } = useUnreadCountStore(
    useShallow(state => ({
      totalUnread: state.totalUnread,
      fetchCounts: state.fetchCounts,
      subscribe: state.subscribe,
      unsubscribe: state.unsubscribe
    }))
  )

  const {
    pendingRsvpCount,
    fetchPendingCounts,
    subscribe: subscribeSquad,
    unsubscribe: unsubscribeSquad
  } = useSquadNotificationsStore(
    useShallow(state => ({
      pendingRsvpCount: state.pendingRsvpCount,
      fetchPendingCounts: state.fetchPendingCounts,
      subscribe: state.subscribe,
      unsubscribe: state.unsubscribe
    }))
  )

  // PHASE 4.2: Global presence
  useGlobalPresence({
    userId: user?.id,
    username: profile?.username || '',
    avatarUrl: profile?.avatar_url || null,
  })

  // PHASE 4.2.3: Custom status modal state
  const [showCustomStatusModal, setShowCustomStatusModal] = useState(false)

  // Sidebar collapse state
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(false)

  // Hydrate sidebar pinned state from localStorage in useEffect to avoid hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-pinned')
    if (saved === 'true') setSidebarPinned(true)
  }, [])

  const isExpanded = sidebarExpanded || sidebarPinned

  // Debounce sidebar expansion (UX 3)
  const sidebarHoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const handleMouseEnter = useCallback(() => {
    sidebarHoverTimer.current = setTimeout(() => setSidebarExpanded(true), 120)
  }, [])
  const handleMouseLeave = useCallback(() => {
    clearTimeout(sidebarHoverTimer.current)
    setSidebarExpanded(false)
  }, [])
  const togglePinned = useCallback(() => setSidebarPinned(p => !p), [])
  // Cleanup hover timer on unmount
  useEffect(() => () => { clearTimeout(sidebarHoverTimer.current) }, [])

  useEffect(() => {
    localStorage.setItem('sidebar-pinned', String(sidebarPinned))
  }, [sidebarPinned])

  useEffect(() => {
    if (!user) return
    fetchCounts()
    subscribe()
    return () => { unsubscribe() }
  }, [user, fetchCounts, subscribe, unsubscribe])

  useEffect(() => {
    if (!user) return
    fetchPendingCounts()
    subscribeSquad()
    return () => { unsubscribeSquad() }
  }, [user, fetchPendingCounts, subscribeSquad, unsubscribeSquad])

  const isPartyActive = useMemo(() => location.pathname === '/party', [location.pathname])
  const currentPath = location.pathname

  if (shouldHideNav) {
    return <>{children}</>
  }

  return (
    <div className="h-[100dvh] bg-bg-base flex overflow-hidden">
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>

      <DesktopSidebar
        isExpanded={isExpanded}
        sidebarPinned={sidebarPinned}
        currentPath={currentPath}
        unreadMessages={unreadMessages}
        pendingRsvpCount={pendingRsvpCount}
        userId={user?.id}
        profile={profile}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTogglePinned={togglePinned}
        onOpenCreateSessionModal={() => openCreateSessionModal()}
        onOpenCustomStatus={() => setShowCustomStatusModal(true)}
      />

      <DesktopContentWrapper isExpanded={isExpanded} isKeyboardVisible={isKeyboardVisible} locationKey={currentPath}>
        <TopBar />
        {children}
      </DesktopContentWrapper>

      <MobileBottomNav
        currentPath={currentPath}
        isPartyActive={isPartyActive}
        isInVoiceChat={isInVoiceChat}
        isKeyboardVisible={isKeyboardVisible}
        unreadMessages={unreadMessages}
        pendingRsvpCount={pendingRsvpCount}
      />

      <CustomStatusModal
        isOpen={showCustomStatusModal}
        onClose={() => setShowCustomStatusModal(false)}
      />
    </div>
  )
}
