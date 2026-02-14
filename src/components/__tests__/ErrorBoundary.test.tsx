import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('../../lib/sentry', () => ({
  captureException: vi.fn(),
}))

import { ErrorBoundary } from '../ErrorBoundary'

// Component that throws
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Child renders fine</div>
}

// Component that throws a chunk error
function ChunkErrorComponent() {
  throw Object.assign(new Error('Failed to fetch dynamically imported module'), { name: 'ChunkLoadError' })
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Child renders fine')).toBeInTheDocument()
  })

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText("Oups, quelque chose s'est mal passé")).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Custom fallback')).toBeInTheDocument()
  })

  it('renders retry button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Réessayer')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Retour')).toBeInTheDocument()
    expect(screen.getByText('Accueil')).toBeInTheDocument()
  })

  it('has alert role for accessibility', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('detects chunk load error and shows update message', () => {
    render(
      <ErrorBoundary>
        <ChunkErrorComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Mise à jour disponible')).toBeInTheDocument()
    expect(screen.getByText('Mettre à jour')).toBeInTheDocument()
  })
})
