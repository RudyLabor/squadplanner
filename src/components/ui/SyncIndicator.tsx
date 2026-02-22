/**
 * Chantier 12 - Background Sync Indicator
 *
 * Small, unobtrusive indicator showing sync status:
 * - Synced: green checkmark (fades out after 2s)
 * - Syncing: spinning icon
 * - Error: warning icon
 *
 * Uses TanStack Query's useIsMutating() to detect pending mutations.
 * Respects dark/light mode via CSS custom properties.
 */
import { memo, useEffect, useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { useIsMutating } from '@tanstack/react-query'

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

export const SyncIndicator = memo(function SyncIndicator() {
  const mutatingCount = useIsMutating()
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [hadError, setHadError] = useState(false)

  useEffect(() => {
    if (mutatingCount > 0) {
      setStatus('syncing')
      setHadError(false)
    } else if (status === 'syncing' && !hadError) {
      // Mutations completed successfully
      setStatus('synced')
      const timer = setTimeout(() => setStatus('idle'), 2000)
      return () => clearTimeout(timer)
    }
  }, [mutatingCount, status, hadError])

  // Listen for mutation errors via a global handler
  useEffect(() => {
    const handler = () => {
      setHadError(true)
      setStatus('error')
      const timer = setTimeout(() => setStatus('idle'), 4000)
      return () => clearTimeout(timer)
    }

    window.addEventListener('sync-error', handler)
    return () => window.removeEventListener('sync-error', handler)
  }, [])

  if (status === 'idle') return null

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={status}
        className="sync-indicator"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        role="status"
        aria-live="polite"
        aria-label={statusLabels[status]}
      >
        {status === 'syncing' && <SyncingIcon />}
        {status === 'synced' && <SyncedIcon />}
        {status === 'error' && <ErrorIcon />}
      </m.div>
    </AnimatePresence>
  )
})

const statusLabels: Record<SyncStatus, string> = {
  idle: '',
  syncing: 'Synchronisation en cours',
  synced: 'Synchronise',
  error: 'Erreur de synchronisation',
}

/** Spinning circle icon for syncing state */
function SyncingIcon() {
  return (
    <m.svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="sync-icon sync-icon--syncing"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="28"
        strokeDashoffset="8"
      />
    </m.svg>
  )
}

/** Checkmark icon for synced state */
function SyncedIcon() {
  return (
    <m.svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="sync-icon sync-icon--synced"
    >
      <m.path
        d="M3 8.5L6.5 12L13 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </m.svg>
  )
}

/** Warning icon for error state */
function ErrorIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="sync-icon sync-icon--error"
    >
      <path d="M8 3v6M8 11.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export default SyncIndicator
