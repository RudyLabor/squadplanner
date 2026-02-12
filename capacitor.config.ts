import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'fr.squadplanner.app',
  appName: 'Squad Planner',
  webDir: 'dist',
  server: {
    // Pour le dev, utiliser l'URL locale
    // url: 'http://192.168.1.X:5173',
    // cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#6366f1',
      sound: 'notification.wav',
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#050506',
  },
  ios: {
    backgroundColor: '#050506',
    contentInset: 'always',
  },
}

export default config
