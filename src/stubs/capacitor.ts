// Stub module replacing @capacitor/* in web builds.
// All Capacitor usage is guarded by runtime checks so these exports are never called,
// but they satisfy the module resolution to eliminate 10KB from the web bundle.
export const Capacitor = { isNativePlatform: () => false, getPlatform: () => 'web' }
export const Plugins = {}
export const Haptics = { impact: async () => {}, notification: async () => {} }
export const ImpactStyle = { Light: 'LIGHT', Medium: 'MEDIUM', Heavy: 'HEAVY' }
export const NotificationType = { Success: 'SUCCESS', Error: 'ERROR', Warning: 'WARNING' }
export const PushNotifications = {
  checkPermissions: async () => ({ receive: 'denied' as const }),
  requestPermissions: async () => ({ receive: 'denied' as const }),
  addListener: async () => ({ remove: () => {} }),
  register: async () => {},
  removeAllListeners: async () => {},
}
export const LocalNotifications = {
  schedule: async () => ({ notifications: [] }),
}
export default {}
