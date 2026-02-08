import { toast } from 'sonner'

/**
 * Standardized toast notifications for Squad Planner
 * Phase 3.4 - Notifications et feedback
 */

// Success toasts - for completed actions
export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 4000,
  })
}

// Error toasts - for API errors, failures
export const showError = (message: string) => {
  toast.error(message, {
    duration: 5000,
  })
}

// Warning toasts - for important notices
export const showWarning = (message: string) => {
  toast.warning(message, {
    duration: 4000,
  })
}

// Info toasts - for general information
export const showInfo = (message: string) => {
  toast.info(message, {
    duration: 3000,
  })
}

// Loading toast with promise - for async operations
export const showLoading = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((err: unknown) => string)
  }
) => {
  return toast.promise(promise, messages)
}

// Dismiss all toasts
export const dismissAll = () => {
  toast.dismiss()
}

// Custom toast with action
export const showWithAction = (
  message: string,
  action: {
    label: string
    onClick: () => void
  }
) => {
  toast(message, {
    action: {
      label: action.label,
      onClick: action.onClick,
    },
  })
}

// Toast with undo action
export const showWithUndo = (
  message: string,
  undoAction: () => void,
  duration = 5000
) => {
  toast(message, {
    duration,
    action: {
      label: 'Annuler',
      onClick: undoAction,
    },
  })
}

// Toast with progress tracking for async operations
export const showProgress = <T,>(
  message: string,
  promise: Promise<T>,
  messages?: { success?: string; error?: string }
) => {
  return toast.promise(promise, {
    loading: message,
    success: messages?.success || 'Fait !',
    error: messages?.error || 'Une erreur est survenue',
  })
}

// Re-export toast for advanced usage
export { toast }
