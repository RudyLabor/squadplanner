"use client";

import { useState, useEffect, lazy, Suspense } from 'react'
import { Outlet } from 'react-router'
import { Toaster } from 'sonner'
import { LazyMotion } from 'framer-motion'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'

// Client-only imports (deferred to avoid SSR issues)
const ClientShell = lazy(() => import('./ClientShell'))

const loadFeatures = () => import('framer-motion').then(mod => mod.domMax)

// SSR-safe fallback - renders just the route content without client-side chrome
function SSRFallback() {
  return <Outlet />
}

/**
 * Client-side provider wrapper for RSC mode.
 * This component is a client boundary — everything inside it hydrates on the client.
 * Server Components rendered by child routes are passed through as pre-rendered elements.
 */
export function ClientProviders() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    import('./hooks/useTheme').then(({ useThemeStore }) => {
      const { mode } = useThemeStore.getState()
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      const effectiveTheme = mode === 'system' ? systemTheme : mode
      document.documentElement.setAttribute('data-theme', effectiveTheme)
      useThemeStore.setState({ effectiveTheme })
    })
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={loadFeatures} strict>
        {isClient ? (
          <Suspense fallback={<SSRFallback />}>
            <ClientShell />
          </Suspense>
        ) : (
          <SSRFallback />
        )}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-default)',
              color: 'var(--color-text-primary)',
              fontSize: '14px',
              borderRadius: '12px',
              padding: '12px 16px',
              position: 'relative' as const,
              overflow: 'hidden',
            },
            classNames: {
              success: 'border-success/20 bg-success/10',
              error: 'border-error/20 bg-error/10',
              warning: 'border-warning/20 bg-warning/10',
              info: 'border-primary/20 bg-primary/10',
            },
          }}
        />
        <div id="aria-live-polite" aria-live="polite" aria-atomic="true" className="sr-only" />
        <div id="aria-live-assertive" aria-live="assertive" aria-atomic="true" className="sr-only" />
      </LazyMotion>
    </QueryClientProvider>
  )
}
