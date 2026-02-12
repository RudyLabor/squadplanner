/**
 * English translations for Squad Planner
 */
import type { TranslationKeys } from './fr'

export const en: TranslationKeys = {
  // Navigation
  nav: {
    home: 'Home',
    sessions: 'Sessions',
    squads: 'Squads',
    party: 'Party',
    messages: 'Messages',
    discover: 'Discover',
    profile: 'Profile',
    settings: 'Settings',
    help: 'Help',
  },

  // Common actions
  actions: {
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    close: 'Close',
    send: 'Send',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    export: 'Export',
    import: 'Import',
    share: 'Share',
    copy: 'Copy',
    duplicate: 'Duplicate',
    archive: 'Archive',
    restore: 'Restore',
    download: 'Download',
    upload: 'Upload',
    preview: 'Preview',
    refresh: 'Refresh',
    retry: 'Retry',
    undo: 'Undo',
    redo: 'Redo',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
  },

  // Empty states
  empty: {
    sessions: 'No sessions yet',
    squads: 'No squads',
    messages: 'No messages',
    notifications: 'No notifications',
    search: 'No results',
    friends: 'No friends online',
    activities: 'No recent activity',
    challenges: 'No active challenges',
  },

  // Status
  status: {
    online: 'Online',
    offline: 'Offline',
    away: 'Away',
    busy: 'Busy',
    inGame: 'In game',
    inCall: 'In call',
  },

  // Time
  time: {
    now: 'Now',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    thisWeek: 'This week',
    nextWeek: 'Next week',
    minutesAgo: (count: number) => `${count} min ago`,
    hoursAgo: (count: number) => `${count}h ago`,
    daysAgo: (count: number) => `${count}d ago`,
    minutes: (count: number) => `${count} minute${count > 1 ? 's' : ''}`,
    hours: (count: number) => `${count} hour${count > 1 ? 's' : ''}`,
    days: (count: number) => `${count} day${count > 1 ? 's' : ''}`,
  },

  // Error messages
  errors: {
    generic: 'An error occurred',
    network: 'Connection error',
    unauthorized: 'Unauthorized',
    notFound: 'Not found',
    validation: 'Invalid data',
    timeout: 'Request timeout',
    offline: 'You are offline',
    serverError: 'Server error',
  },

  // Success messages
  success: {
    saved: 'Saved successfully',
    deleted: 'Deleted successfully',
    created: 'Created successfully',
    updated: 'Updated successfully',
    sent: 'Sent successfully',
    copied: 'Copied to clipboard',
  },

  // Notifications
  notifications: {
    title: 'Notifications',
    markAllRead: 'Mark all as read',
    newSession: 'New session',
    sessionReminder: 'Session reminder',
    newMessage: 'New message',
    newMember: 'New member',
    squadInvite: 'Squad invitation',
    friendRequest: 'Friend request',
  },

  // Sessions
  sessions: {
    create: 'Create session',
    edit: 'Edit session',
    delete: 'Delete session',
    details: 'Session details',
    participants: 'Participants',
    game: 'Game',
    datetime: 'Date and time',
    duration: 'Duration',
    recurring: 'Recurring',
    visibility: 'Visibility',
    notes: 'Notes',
    rsvp: {
      yes: 'Going',
      no: 'Not going',
      maybe: 'Maybe',
    },
  },

  // Squads
  squads: {
    create: 'Create squad',
    edit: 'Edit squad',
    delete: 'Delete squad',
    leave: 'Leave squad',
    members: (count: number) => `${count} member${count > 1 ? 's' : ''}`,
    invite: 'Invite members',
    settings: 'Squad settings',
    stats: 'Statistics',
    leaderboard: 'Leaderboard',
  },

  // Messages
  messages: {
    send: 'Send message',
    type: 'Type a message...',
    reply: 'Reply',
    edit: 'Edit',
    delete: 'Delete',
    react: 'React',
    pin: 'Pin',
    unpin: 'Unpin',
    thread: 'Thread',
  },

  // Settings
  settings: {
    title: 'Settings',
    subtitle: 'Customize your experience',
    notifications: {
      title: 'Notifications',
      sessions: 'Sessions',
      sessionsDesc: 'Session reminders and confirmations',
      messages: 'Messages',
      messagesDesc: 'New messages from your squad',
      party: 'Voice party',
      partyDesc: 'When someone joins the party',
      reminders: 'Automatic reminders',
      remindersDesc: '30 min before each session',
    },
    audio: {
      title: 'Audio',
      microphone: 'Microphone',
      output: 'Audio output',
      defaultMic: 'Default microphone',
      defaultOutput: 'Default speaker',
    },
    appearance: {
      title: 'Appearance',
      theme: 'Theme',
      themeDesc: 'Customize the app appearance',
      dark: 'Dark',
      light: 'Light',
      auto: 'Auto',
    },
    privacy: {
      title: 'Privacy',
      profileVisibility: 'Profile visibility',
      profileVisibilityDesc: 'Who can see your stats',
      onlineStatus: 'Online status',
      onlineStatusDesc: 'Show when you are online',
      visibilityOptions: {
        public: 'Everyone',
        friends: 'Squad members',
        private: 'No one',
      },
    },
    region: {
      title: 'Region',
      timezone: 'Timezone',
      language: 'Language',
      selectTimezone: 'Choose a timezone',
    },
    data: {
      title: 'Data',
      export: 'Export my data',
      exportDesc: 'Download all your information (GDPR)',
      exporting: 'Exporting...',
      delete: 'Delete my account',
      deleteDesc: 'Irreversible action',
    },
    legal: {
      title: 'Legal',
      terms: 'Terms of service',
      termsDesc: 'Squad Planner ToS',
      privacy: 'Privacy policy',
      privacyDesc: 'GDPR & data protection',
      landing: 'Public homepage',
      landingDesc: 'View the landing page',
    },
    signOut: 'Sign out',
    version: 'Squad Planner v1.0.0',
    saved: 'Settings saved',
  },

  // Premium
  premium: {
    title: 'Premium',
    subtitle: 'Unlock all features',
    features: {
      unlimitedSquads: 'Unlimited squads',
      advancedStats: 'Advanced statistics',
      customThemes: 'Custom themes',
      prioritySupport: 'Priority support',
    },
    upgrade: 'Upgrade to Premium',
    currentPlan: 'Your plan',
  },

  // Auth
  auth: {
    signIn: 'Sign in',
    signUp: 'Sign up',
    signOut: 'Sign out',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    resetPassword: 'Reset',
    welcome: 'Welcome to Squad Planner',
    welcomeBack: 'Welcome back!',
  },
} as const
