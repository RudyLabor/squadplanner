"use client";

import { isRouteErrorResponse, useRouteError } from 'react-router'

export function ErrorBoundaryClient() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-primary mb-4">{error.status}</h1>
          <p className="text-text-secondary text-lg">{error.statusText}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-error mb-4">Oops!</h1>
        <p className="text-text-secondary text-lg">Une erreur inattendue est survenue.</p>
      </div>
    </div>
  )
}
