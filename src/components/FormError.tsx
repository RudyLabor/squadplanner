import { useEffect, useRef } from 'react'
import { humanizeError } from '../lib/errorMessages'
import { announce } from '../lib/announce'

interface FormErrorProps {
  error?: Error | string | null
  fieldName?: string
  onRetry?: () => void
}

/**
 * Displays human-friendly error messages with accessibility announcements.
 * Shakes invalid form fields and announces to screen readers.
 */
export function FormError({ error, fieldName, onRetry }: FormErrorProps) {
  const fieldRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!error) return

    // Announce to screen readers
    const message = humanizeError(error)
    announce(message, 'assertive')

    // Add shake animation to field
    if (fieldRef.current && fieldName) {
      fieldRef.current.classList.add('field-shake')
      const timer = setTimeout(() => {
        fieldRef.current?.classList.remove('field-shake')
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [error, fieldName])

  if (!error) return null

  const message = humanizeError(error)

  return (
    <div
      ref={fieldRef}
      role="alert"
      className="flex items-start gap-2 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm"
    >
      <svg
        className="w-4 h-4 flex-shrink-0 mt-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <div className="flex-1">
        <p className="font-medium">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm underline hover:no-underline font-medium"
          >
            Réessayer
          </button>
        )}
      </div>
    </div>
  )
}
