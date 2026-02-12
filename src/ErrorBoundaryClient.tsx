"use client";

import { isRouteErrorResponse, useRouteError } from 'react-router'

export function ErrorBoundaryClient() {
  const error = useRouteError()
  const isRoute = isRouteErrorResponse(error)
  const status = isRoute ? error.status : 500
  const message = isRoute ? error.statusText : 'Une erreur inattendue est survenue'

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Sidebar de navigation simplifiée */}
      <nav className="hidden lg:flex w-[200px] shrink-0 bg-bg-elevated border-r border-border-subtle flex-col p-4" aria-label="Menu principal">
        <a href="/" className="flex items-center gap-2 mb-8 px-2">
          <img src="/favicon.svg" alt="Squad Planner" className="w-8 h-8" />
          <span className="font-semibold text-text-primary">Squad Planner</span>
        </a>
        <div className="flex flex-col gap-1">
          <a href="/squads" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors text-sm">Mes Squads</a>
          <a href="/sessions" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors text-sm">Sessions</a>
          <a href="/messages" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors text-sm">Messages</a>
          <a href="/discover" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors text-sm">Découvrir</a>
          <a href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors text-sm">Profil</a>
        </div>
        <div className="mt-auto">
          <a href="/help" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors text-sm">Aide</a>
          <a href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-hover transition-colors text-sm">Paramètres</a>
        </div>
      </nav>

      {/* Contenu d'erreur */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">😵</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {isRoute ? status : 'Quelque chose s\'est mal passé'}
          </h1>
          <p className="text-md text-text-secondary mb-8">
            {message}. Tu peux essayer de recharger la page ou revenir à la navigation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-md font-medium hover:bg-primary-hover transition-colors"
            >
              Recharger la page
            </button>
            <a
              href="/squads"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-overlay-subtle text-text-secondary text-md font-medium hover:bg-overlay-light transition-colors border border-border-subtle"
            >
              Mes Squads
            </a>
          </div>
          {/* Navigation mobile */}
          <div className="lg:hidden mt-6 flex flex-wrap gap-2 justify-center">
            <a href="/squads" className="px-4 py-2 rounded-lg bg-bg-elevated text-text-secondary text-sm hover:bg-bg-hover transition-colors">Squads</a>
            <a href="/sessions" className="px-4 py-2 rounded-lg bg-bg-elevated text-text-secondary text-sm hover:bg-bg-hover transition-colors">Sessions</a>
            <a href="/messages" className="px-4 py-2 rounded-lg bg-bg-elevated text-text-secondary text-sm hover:bg-bg-hover transition-colors">Messages</a>
            <a href="/discover" className="px-4 py-2 rounded-lg bg-bg-elevated text-text-secondary text-sm hover:bg-bg-hover transition-colors">Découvrir</a>
            <a href="/help" className="px-4 py-2 rounded-lg bg-bg-elevated text-text-secondary text-sm hover:bg-bg-hover transition-colors">Aide</a>
          </div>
        </div>
      </div>
    </div>
  )
}
