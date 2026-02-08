import { toast } from 'sonner'
import { createElement } from 'react'
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { AnimatedCheckmark, AnimatedXMark, AnimatedWarning, AnimatedInfo } from '../components/ui/ToastIcons'

/**
 * Standardized toast notifications for Squad Planner
 * Phase 3.4 - Notifications et feedback
 * Phase 2.5 - Sound + Haptics (Capacitor integration)
 * V3 - Animated icons + progress bar
 */

// Haptic feedback helper — only fires on native platforms (iOS/Android)
const haptic = {
  success: () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.notification({ type: NotificationType.Success })
    }
  },
  error: () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.notification({ type: NotificationType.Error })
    }
  },
  warning: () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.notification({ type: NotificationType.Warning })
    }
  },
  tap: () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Medium })
    }
  },
}

// Success toasts - for completed actions
export const showSuccess = (message: string) => {
  haptic.success()
  toast.success(message, {
    duration: 4000,
    icon: createElement(AnimatedCheckmark, { size: 20 }),
    style: { '--toast-duration': '4s' } as React.CSSProperties,
  })
}

// Error toasts - for API errors, failures
export const showError = (message: string) => {
  haptic.error()
  toast.error(message, {
    duration: 5000,
    icon: createElement(AnimatedXMark, { size: 20 }),
    style: { '--toast-duration': '5s' } as React.CSSProperties,
  })
}

// Warning toasts - for important notices
export const showWarning = (message: string) => {
  haptic.warning()
  toast.warning(message, {
    duration: 4000,
    icon: createElement(AnimatedWarning, { size: 20 }),
    style: { '--toast-duration': '4s' } as React.CSSProperties,
  })
}

// Info toasts - for general information
export const showInfo = (message: string) => {
  toast.info(message, {
    duration: 3000,
    icon: createElement(AnimatedInfo, { size: 20 }),
    style: { '--toast-duration': '3s' } as React.CSSProperties,
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
    style: { '--toast-duration': `${duration / 1000}s` } as React.CSSProperties,
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
