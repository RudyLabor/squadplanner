/**
 * Haptic Feedback Utilities for Squad Planner
 *
 * Provides vibration patterns for different UI interactions.
 * Uses the Web Vibration API (supported on most mobile browsers).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
 */

export const haptic = {
  /** Light tap - for subtle interactions like hovering or minor selections */
  light: () => navigator.vibrate?.(10),

  /** Medium tap - for standard button presses and confirmations */
  medium: () => navigator.vibrate?.(25),

  /** Heavy tap - for important actions or confirmations */
  heavy: () => navigator.vibrate?.(50),

  /** Success pattern - double pulse for positive feedback */
  success: () => navigator.vibrate?.([10, 50, 10]),

  /** Error pattern - strong double pulse for errors */
  error: () => navigator.vibrate?.([50, 100, 50]),

  /** Warning pattern - medium double pulse for warnings */
  warning: () => navigator.vibrate?.([25, 50, 25]),

  /** Selection - very light tap for list item selections */
  selection: () => navigator.vibrate?.(5),

  /** Notification - attention-grabbing pattern for notifications */
  notification: () => navigator.vibrate?.([15, 30, 15, 30, 15]),

  /** Achievement unlocked - celebratory pattern */
  achievement: () => navigator.vibrate?.([10, 30, 10, 30, 50, 100, 50]),

  /** Level up - triumphant ascending pattern */
  levelUp: () => navigator.vibrate?.([20, 50, 30, 50, 40, 50, 100]),
}

/** Check if haptic feedback is enabled in user preferences */
export const getHapticEnabled = (): boolean => {
  return localStorage.getItem('hapticEnabled') !== 'false'
}

/** Set haptic feedback preference */
export const setHapticEnabled = (enabled: boolean): void => {
  localStorage.setItem('hapticEnabled', String(enabled))
}

/** Check if the device supports vibration */
export const isHapticSupported = (): boolean => {
  return 'vibrate' in navigator
}
