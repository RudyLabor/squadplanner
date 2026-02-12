/**
 * Traductions françaises pour Squad Planner
 */
export const fr = {
  // Navigation
  nav: {
    home: 'Accueil',
    sessions: 'Sessions',
    squads: 'Squads',
    party: 'Party',
    messages: 'Messages',
    discover: 'Découvrir',
    profile: 'Profil',
    settings: 'Paramètres',
    help: 'Aide',
  },

  // Actions communes
  actions: {
    create: 'Créer',
    edit: 'Modifier',
    delete: 'Supprimer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    confirm: 'Confirmer',
    back: 'Retour',
    next: 'Suivant',
    finish: 'Terminer',
    close: 'Fermer',
    send: 'Envoyer',
    search: 'Rechercher',
    filter: 'Filtrer',
    sort: 'Trier',
    export: 'Exporter',
    import: 'Importer',
    share: 'Partager',
    copy: 'Copier',
    duplicate: 'Dupliquer',
    archive: 'Archiver',
    restore: 'Restaurer',
    download: 'Télécharger',
    upload: 'Importer',
    preview: 'Aperçu',
    refresh: 'Actualiser',
    retry: 'Réessayer',
    undo: 'Annuler',
    redo: 'Refaire',
    selectAll: 'Tout sélectionner',
    deselectAll: 'Tout désélectionner',
  },

  // États vides
  empty: {
    sessions: 'Aucune session pour le moment',
    squads: 'Aucune squad',
    messages: 'Aucun message',
    notifications: 'Aucune notification',
    search: 'Aucun résultat',
    friends: 'Aucun ami en ligne',
    activities: 'Aucune activité récente',
    challenges: 'Aucun défi actif',
  },

  // Statuts
  status: {
    online: 'En ligne',
    offline: 'Hors ligne',
    away: 'Absent',
    busy: 'Occupé',
    inGame: 'En jeu',
    inCall: 'En appel',
  },

  // Temps
  time: {
    now: 'Maintenant',
    today: 'Aujourd\'hui',
    yesterday: 'Hier',
    tomorrow: 'Demain',
    thisWeek: 'Cette semaine',
    nextWeek: 'Semaine prochaine',
    minutesAgo: (count: number) => `Il y a ${count} min`,
    hoursAgo: (count: number) => `Il y a ${count}h`,
    daysAgo: (count: number) => `Il y a ${count}j`,
    minutes: (count: number) => `${count} minute${count > 1 ? 's' : ''}`,
    hours: (count: number) => `${count} heure${count > 1 ? 's' : ''}`,
    days: (count: number) => `${count} jour${count > 1 ? 's' : ''}`,
  },

  // Messages d'erreur
  errors: {
    generic: 'Une erreur est survenue',
    network: 'Erreur de connexion',
    unauthorized: 'Non autorisé',
    notFound: 'Introuvable',
    validation: 'Données invalides',
    timeout: 'Délai d\'attente dépassé',
    offline: 'Vous êtes hors ligne',
    serverError: 'Erreur serveur',
  },

  // Messages de succès
  success: {
    saved: 'Enregistré avec succès',
    deleted: 'Supprimé avec succès',
    created: 'Créé avec succès',
    updated: 'Mis à jour avec succès',
    sent: 'Envoyé avec succès',
    copied: 'Copié dans le presse-papiers',
  },

  // Notifications
  notifications: {
    title: 'Notifications',
    markAllRead: 'Tout marquer comme lu',
    newSession: 'Nouvelle session',
    sessionReminder: 'Rappel de session',
    newMessage: 'Nouveau message',
    newMember: 'Nouveau membre',
    squadInvite: 'Invitation à une squad',
    friendRequest: 'Demande d\'ami',
  },

  // Sessions
  sessions: {
    create: 'Créer une session',
    edit: 'Modifier la session',
    delete: 'Supprimer la session',
    details: 'Détails de la session',
    participants: 'Participants',
    game: 'Jeu',
    datetime: 'Date et heure',
    duration: 'Durée',
    recurring: 'Récurrente',
    visibility: 'Visibilité',
    notes: 'Notes',
    rsvp: {
      yes: 'Je viens',
      no: 'Absent',
      maybe: 'Peut-être',
    },
  },

  // Squads
  squads: {
    create: 'Créer une squad',
    edit: 'Modifier la squad',
    delete: 'Supprimer la squad',
    leave: 'Quitter la squad',
    members: (count: number) => `${count} membre${count > 1 ? 's' : ''}`,
    invite: 'Inviter des membres',
    settings: 'Paramètres de la squad',
    stats: 'Statistiques',
    leaderboard: 'Classement',
  },

  // Messages
  messages: {
    send: 'Envoyer un message',
    type: 'Écris un message...',
    reply: 'Répondre',
    edit: 'Modifier',
    delete: 'Supprimer',
    react: 'Réagir',
    pin: 'Épingler',
    unpin: 'Désépingler',
    thread: 'Fil de discussion',
  },

  // Paramètres
  settings: {
    title: 'Paramètres',
    subtitle: 'Personnalise ton expérience',
    notifications: {
      title: 'Notifications',
      sessions: 'Sessions',
      sessionsDesc: 'Rappels et confirmations de sessions',
      messages: 'Messages',
      messagesDesc: 'Nouveaux messages de ta squad',
      party: 'Party vocale',
      partyDesc: 'Quand quelqu\'un rejoint la party',
      reminders: 'Rappels automatiques',
      remindersDesc: '30 min avant chaque session',
    },
    audio: {
      title: 'Audio',
      microphone: 'Microphone',
      output: 'Sortie audio',
      defaultMic: 'Microphone par défaut',
      defaultOutput: 'Haut-parleur par défaut',
    },
    appearance: {
      title: 'Apparence',
      theme: 'Thème',
      themeDesc: 'Adapte l\'apparence de l\'app',
      dark: 'Sombre',
      light: 'Clair',
      auto: 'Auto',
    },
    privacy: {
      title: 'Confidentialité',
      profileVisibility: 'Visibilité du profil',
      profileVisibilityDesc: 'Qui peut voir tes stats',
      onlineStatus: 'Statut en ligne',
      onlineStatusDesc: 'Montre quand tu es connecté',
      visibilityOptions: {
        public: 'Tout le monde',
        friends: 'Membres de mes squads',
        private: 'Personne',
      },
    },
    region: {
      title: 'Région',
      timezone: 'Fuseau horaire',
      language: 'Langue',
      selectTimezone: 'Choisis un fuseau horaire',
    },
    data: {
      title: 'Données',
      export: 'Exporter mes données',
      exportDesc: 'Télécharge toutes tes infos (RGPD)',
      exporting: 'Export en cours...',
      delete: 'Supprimer mon compte',
      deleteDesc: 'Action irréversible',
    },
    legal: {
      title: 'Légal',
      terms: 'Conditions d\'utilisation',
      termsDesc: 'CGU de Squad Planner',
      privacy: 'Politique de confidentialité',
      privacyDesc: 'RGPD & protection des données',
      landing: 'Page d\'accueil publique',
      landingDesc: 'Voir la landing page',
    },
    signOut: 'Se déconnecter',
    version: 'Squad Planner v1.0.0',
    saved: 'Paramètres sauvegardés',
  },

  // Premium
  premium: {
    title: 'Premium',
    subtitle: 'Débloquez toutes les fonctionnalités',
    features: {
      unlimitedSquads: 'Squads illimitées',
      advancedStats: 'Statistiques avancées',
      customThemes: 'Thèmes personnalisés',
      prioritySupport: 'Support prioritaire',
    },
    upgrade: 'Passer Premium',
    currentPlan: 'Votre forfait',
  },

  // Auth
  auth: {
    signIn: 'Se connecter',
    signUp: 'S\'inscrire',
    signOut: 'Se déconnecter',
    email: 'Email',
    password: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    resetPassword: 'Réinitialiser',
    welcome: 'Bienvenue sur Squad Planner',
    welcomeBack: 'Content de te revoir !',
  },
} as const

export type TranslationKeys = typeof fr
