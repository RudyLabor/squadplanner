/**
 * Deutsche Übersetzungen für Squad Planner
 */
export const de = {
  // Navigation
  nav: {
    home: 'Startseite',
    sessions: 'Sessions',
    squads: 'Squads',
    party: 'Party',
    messages: 'Nachrichten',
    discover: 'Entdecken',
    profile: 'Profil',
    settings: 'Einstellungen',
    help: 'Hilfe',
  },

  // Allgemeine Aktionen
  actions: {
    create: 'Erstellen',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    confirm: 'Bestätigen',
    back: 'Zurück',
    next: 'Weiter',
    finish: 'Fertig',
    close: 'Schließen',
    send: 'Senden',
    search: 'Suchen',
    filter: 'Filtern',
    sort: 'Sortieren',
    export: 'Exportieren',
    import: 'Importieren',
    share: 'Teilen',
    copy: 'Kopieren',
    duplicate: 'Duplizieren',
    archive: 'Archivieren',
    restore: 'Wiederherstellen',
    download: 'Herunterladen',
    upload: 'Hochladen',
    preview: 'Vorschau',
    refresh: 'Aktualisieren',
    retry: 'Erneut versuchen',
    undo: 'Rückgängig',
    redo: 'Wiederherstellen',
    selectAll: 'Alles auswählen',
    deselectAll: 'Auswahl aufheben',
  },

  // Leere Zustände
  empty: {
    sessions: 'Keine Sessions vorhanden',
    squads: 'Keine Squads',
    messages: 'Keine Nachrichten',
    notifications: 'Keine Benachrichtigungen',
    search: 'Keine Ergebnisse',
    friends: 'Keine Freunde online',
    activities: 'Keine aktuelle Aktivität',
    challenges: 'Keine aktiven Herausforderungen',
  },

  // Status
  status: {
    online: 'Online',
    offline: 'Offline',
    away: 'Abwesend',
    busy: 'Beschäftigt',
    inGame: 'Im Spiel',
    inCall: 'Im Anruf',
  },

  // Zeit
  time: {
    now: 'Jetzt',
    today: 'Heute',
    yesterday: 'Gestern',
    tomorrow: 'Morgen',
    thisWeek: 'Diese Woche',
    nextWeek: 'Nächste Woche',
    minutesAgo: (count: number) => `vor ${count} Min`,
    hoursAgo: (count: number) => `vor ${count}h`,
    daysAgo: (count: number) => `vor ${count}d`,
    minutes: (count: number) => `${count} Minute${count > 1 ? 'n' : ''}`,
    hours: (count: number) => `${count} Stunde${count > 1 ? 'n' : ''}`,
    days: (count: number) => `${count} Tag${count > 1 ? 'e' : ''}`,
  },

  // Fehlermeldungen
  errors: {
    generic: 'Ein Fehler ist aufgetreten',
    network: 'Verbindungsfehler',
    unauthorized: 'Nicht autorisiert',
    notFound: 'Nicht gefunden',
    validation: 'Ungültige Daten',
    timeout: 'Zeitüberschreitung',
    offline: 'Du bist offline',
    serverError: 'Serverfehler',
  },

  // Erfolgsmeldungen
  success: {
    saved: 'Erfolgreich gespeichert',
    deleted: 'Erfolgreich gelöscht',
    created: 'Erfolgreich erstellt',
    updated: 'Erfolgreich aktualisiert',
    sent: 'Erfolgreich gesendet',
    copied: 'In die Zwischenablage kopiert',
  },

  // Benachrichtigungen
  notifications: {
    title: 'Benachrichtigungen',
    markAllRead: 'Alle als gelesen markieren',
    newSession: 'Neue Session',
    sessionReminder: 'Session-Erinnerung',
    newMessage: 'Neue Nachricht',
    newMember: 'Neues Mitglied',
    squadInvite: 'Squad-Einladung',
    friendRequest: 'Freundschaftsanfrage',
  },

  // Sessions
  sessions: {
    create: 'Session erstellen',
    edit: 'Session bearbeiten',
    delete: 'Session löschen',
    details: 'Session-Details',
    participants: 'Teilnehmer',
    game: 'Spiel',
    datetime: 'Datum und Uhrzeit',
    duration: 'Dauer',
    recurring: 'Wiederkehrend',
    visibility: 'Sichtbarkeit',
    notes: 'Notizen',
    rsvp: {
      yes: 'Ich komme',
      no: 'Ich komme nicht',
      maybe: 'Vielleicht',
    },
  },

  // Squads
  squads: {
    create: 'Squad erstellen',
    edit: 'Squad bearbeiten',
    delete: 'Squad löschen',
    leave: 'Squad verlassen',
    members: (count: number) => `${count} Mitglied${count > 1 ? 'er' : ''}`,
    invite: 'Mitglieder einladen',
    settings: 'Squad-Einstellungen',
    stats: 'Statistiken',
    leaderboard: 'Bestenliste',
  },

  // Nachrichten
  messages: {
    send: 'Nachricht senden',
    type: 'Schreib eine Nachricht...',
    reply: 'Antworten',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    react: 'Reagieren',
    pin: 'Anheften',
    unpin: 'Abheften',
    thread: 'Thread',
  },

  // Einstellungen
  settings: {
    title: 'Einstellungen',
    subtitle: 'Personalisiere dein Erlebnis',
    notifications: {
      title: 'Benachrichtigungen',
      sessions: 'Sessions',
      sessionsDesc: 'Session-Erinnerungen und Bestätigungen',
      messages: 'Nachrichten',
      messagesDesc: 'Neue Nachrichten von deiner Squad',
      party: 'Voice Party',
      partyDesc: 'Wenn jemand der Party beitritt',
      reminders: 'Automatische Erinnerungen',
      remindersDesc: '30 Min vor jeder Session',
    },
    audio: {
      title: 'Audio',
      microphone: 'Mikrofon',
      output: 'Audioausgabe',
      defaultMic: 'Standardmikrofon',
      defaultOutput: 'Standardlautsprecher',
    },
    appearance: {
      title: 'Erscheinungsbild',
      theme: 'Design',
      themeDesc: 'Passe das Aussehen der App an',
      dark: 'Dunkel',
      light: 'Hell',
      auto: 'Automatisch',
    },
    privacy: {
      title: 'Datenschutz',
      profileVisibility: 'Profilsichtbarkeit',
      profileVisibilityDesc: 'Wer kann deine Statistiken sehen',
      onlineStatus: 'Online-Status',
      onlineStatusDesc: 'Zeige, wenn du online bist',
      visibilityOptions: {
        public: 'Jeder',
        friends: 'Mitglieder meiner Squads',
        private: 'Niemand',
      },
    },
    region: {
      title: 'Region',
      timezone: 'Zeitzone',
      language: 'Sprache',
      selectTimezone: 'Wähle eine Zeitzone',
    },
    data: {
      title: 'Daten',
      export: 'Meine Daten exportieren',
      exportDesc: 'Lade alle deine Informationen herunter (DSGVO)',
      exporting: 'Wird exportiert...',
      delete: 'Mein Konto löschen',
      deleteDesc: 'Nicht rückgängig zu machen',
    },
    legal: {
      title: 'Rechtliches',
      terms: 'Nutzungsbedingungen',
      termsDesc: 'Squad Planner Bedingungen',
      privacy: 'Datenschutzrichtlinie',
      privacyDesc: 'DSGVO & Datenschutz',
      landing: 'Öffentliche Startseite',
      landingDesc: 'Landing Page anzeigen',
    },
    signOut: 'Abmelden',
    version: 'Squad Planner',
    saved: 'Einstellungen gespeichert',
  },

  // Premium
  premium: {
    title: 'Premium',
    subtitle: 'Schalte alle Funktionen frei',
    features: {
      unlimitedSquads: 'Unbegrenzte Squads',
      advancedStats: 'Erweiterte Statistiken',
      customThemes: 'Benutzerdefinierte Designs',
      prioritySupport: 'Prioritätssupport',
    },
    upgrade: 'Upgrade zu Premium',
    currentPlan: 'Dein aktueller Plan',
  },

  // Authentifizierung
  auth: {
    signIn: 'Anmelden',
    signUp: 'Registrieren',
    signOut: 'Abmelden',
    email: 'E-Mail',
    password: 'Passwort',
    forgotPassword: 'Passwort vergessen?',
    resetPassword: 'Zurücksetzen',
    welcome: 'Willkommen bei Squad Planner',
    welcomeBack: 'Schön, dich wiederzusehen!',
  },
} as const

/** Struktur der Übersetzungen mit String-Werten (keine strikten Literale) */
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>
}

export type TranslationKeys = DeepStringify<typeof de>
