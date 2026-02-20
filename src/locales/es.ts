/**
 * Traducciones españolas para Squad Planner
 */
export const es = {
  // Navegación
  nav: {
    home: 'Inicio',
    sessions: 'Sesiones',
    squads: 'Squads',
    party: 'Party',
    messages: 'Mensajes',
    discover: 'Descubrir',
    profile: 'Perfil',
    settings: 'Configuración',
    help: 'Ayuda',
  },

  // Acciones comunes
  actions: {
    create: 'Crear',
    edit: 'Editar',
    delete: 'Eliminar',
    cancel: 'Cancelar',
    save: 'Guardar',
    confirm: 'Confirmar',
    back: 'Atrás',
    next: 'Siguiente',
    finish: 'Finalizar',
    close: 'Cerrar',
    send: 'Enviar',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    export: 'Exportar',
    import: 'Importar',
    share: 'Compartir',
    copy: 'Copiar',
    duplicate: 'Duplicar',
    archive: 'Archivar',
    restore: 'Restaurar',
    download: 'Descargar',
    upload: 'Cargar',
    preview: 'Vista previa',
    refresh: 'Actualizar',
    retry: 'Reintentar',
    undo: 'Deshacer',
    redo: 'Rehacer',
    selectAll: 'Seleccionar todo',
    deselectAll: 'Deseleccionar todo',
  },

  // Estados vacíos
  empty: {
    sessions: 'Sin sesiones por el momento',
    squads: 'Sin squads',
    messages: 'Sin mensajes',
    notifications: 'Sin notificaciones',
    search: 'Sin resultados',
    friends: 'Sin amigos en línea',
    activities: 'Sin actividad reciente',
    challenges: 'Sin desafíos activos',
  },

  // Estados
  status: {
    online: 'En línea',
    offline: 'Desconectado',
    away: 'Ausente',
    busy: 'Ocupado',
    inGame: 'Jugando',
    inCall: 'En llamada',
  },

  // Tiempo
  time: {
    now: 'Ahora',
    today: 'Hoy',
    yesterday: 'Ayer',
    tomorrow: 'Mañana',
    thisWeek: 'Esta semana',
    nextWeek: 'Próxima semana',
    minutesAgo: (count: number) => `Hace ${count} min`,
    hoursAgo: (count: number) => `Hace ${count}h`,
    daysAgo: (count: number) => `Hace ${count}d`,
    minutes: (count: number) => `${count} minuto${count > 1 ? 's' : ''}`,
    hours: (count: number) => `${count} hora${count > 1 ? 's' : ''}`,
    days: (count: number) => `${count} día${count > 1 ? 's' : ''}`,
  },

  // Mensajes de error
  errors: {
    generic: 'Algo salió mal',
    network: 'Error de conexión',
    unauthorized: 'No autorizado',
    notFound: 'No encontrado',
    validation: 'Datos inválidos',
    timeout: 'Tiempo de espera agotado',
    offline: 'Estás desconectado',
    serverError: 'Error del servidor',
  },

  // Mensajes de éxito
  success: {
    saved: 'Guardado correctamente',
    deleted: 'Eliminado correctamente',
    created: 'Creado correctamente',
    updated: 'Actualizado correctamente',
    sent: 'Enviado correctamente',
    copied: 'Copiado al portapapeles',
  },

  // Notificaciones
  notifications: {
    title: 'Notificaciones',
    markAllRead: 'Marcar todo como leído',
    newSession: 'Nueva sesión',
    sessionReminder: 'Recordatorio de sesión',
    newMessage: 'Nuevo mensaje',
    newMember: 'Nuevo miembro',
    squadInvite: 'Invitación a una squad',
    friendRequest: 'Solicitud de amistad',
  },

  // Sesiones
  sessions: {
    create: 'Crear sesión',
    edit: 'Editar sesión',
    delete: 'Eliminar sesión',
    details: 'Detalles de la sesión',
    participants: 'Participantes',
    game: 'Juego',
    datetime: 'Fecha y hora',
    duration: 'Duración',
    recurring: 'Recurrente',
    visibility: 'Visibilidad',
    notes: 'Notas',
    rsvp: {
      yes: 'Voy a ir',
      no: 'No voy',
      maybe: 'Quizás',
    },
  },

  // Squads
  squads: {
    create: 'Crear squad',
    edit: 'Editar squad',
    delete: 'Eliminar squad',
    leave: 'Abandonar squad',
    members: (count: number) => `${count} miembro${count > 1 ? 's' : ''}`,
    invite: 'Invitar miembros',
    settings: 'Configuración de la squad',
    stats: 'Estadísticas',
    leaderboard: 'Clasificación',
  },

  // Mensajes
  messages: {
    send: 'Enviar mensaje',
    type: 'Escribe un mensaje...',
    reply: 'Responder',
    edit: 'Editar',
    delete: 'Eliminar',
    react: 'Reaccionar',
    pin: 'Fijar',
    unpin: 'Desfijar',
    thread: 'Hilo',
  },

  // Configuración
  settings: {
    title: 'Configuración',
    subtitle: 'Personaliza tu experiencia',
    notifications: {
      title: 'Notificaciones',
      sessions: 'Sesiones',
      sessionsDesc: 'Recordatorios y confirmaciones de sesiones',
      messages: 'Mensajes',
      messagesDesc: 'Mensajes nuevos de tu squad',
      party: 'Party de voz',
      partyDesc: 'Cuando alguien se une a la party',
      reminders: 'Recordatorios automáticos',
      remindersDesc: '30 min antes de cada sesión',
    },
    audio: {
      title: 'Audio',
      microphone: 'Micrófono',
      output: 'Salida de audio',
      defaultMic: 'Micrófono predeterminado',
      defaultOutput: 'Altavoz predeterminado',
    },
    appearance: {
      title: 'Apariencia',
      theme: 'Tema',
      themeDesc: 'Personaliza el aspecto de la app',
      dark: 'Oscuro',
      light: 'Claro',
      auto: 'Auto',
    },
    privacy: {
      title: 'Privacidad',
      profileVisibility: 'Visibilidad del perfil',
      profileVisibilityDesc: 'Quién puede ver tus estadísticas',
      onlineStatus: 'Estado en línea',
      onlineStatusDesc: 'Muestra cuándo estás conectado',
      visibilityOptions: {
        public: 'Todos',
        friends: 'Miembros de mis squads',
        private: 'Nadie',
      },
    },
    region: {
      title: 'Región',
      timezone: 'Zona horaria',
      language: 'Idioma',
      selectTimezone: 'Selecciona una zona horaria',
    },
    data: {
      title: 'Datos',
      export: 'Exportar mis datos',
      exportDesc: 'Descarga toda tu información (RGPD)',
      exporting: 'Exportando...',
      delete: 'Eliminar mi cuenta',
      deleteDesc: 'Acción irreversible',
    },
    legal: {
      title: 'Legal',
      terms: 'Términos de servicio',
      termsDesc: 'Términos y condiciones de Squad Planner',
      privacy: 'Política de privacidad',
      privacyDesc: 'RGPD y protección de datos',
      landing: 'Página de inicio pública',
      landingDesc: 'Ver la página de inicio',
    },
    signOut: 'Cerrar sesión',
    version: 'Squad Planner v1.0.0',
    saved: 'Configuración guardada',
  },

  // Premium
  premium: {
    title: 'Premium',
    subtitle: 'Desbloquea todas las funcionalidades',
    features: {
      unlimitedSquads: 'Squads ilimitadas',
      advancedStats: 'Estadísticas avanzadas',
      customThemes: 'Temas personalizados',
      prioritySupport: 'Soporte prioritario',
    },
    upgrade: 'Mejorar a Premium',
    currentPlan: 'Tu plan actual',
  },

  // Autenticación
  auth: {
    signIn: 'Iniciar sesión',
    signUp: 'Registrarse',
    signOut: 'Cerrar sesión',
    email: 'Correo electrónico',
    password: 'Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    resetPassword: 'Restablecer',
    welcome: 'Bienvenido a Squad Planner',
    welcomeBack: '¡Nos alegra verte de nuevo!',
  },
} as const

/** Estructura de traducciones con valores string (no literales estrictos) */
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>
}

export type TranslationKeys = DeepStringify<typeof es>
