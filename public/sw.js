// Service Worker for SquadPlanner Push Notifications
// This runs in the background and handles push events even when the app is closed

const CACHE_NAME = 'squadplanner-v1';

// Install event - cache essential assets
self.addEventListener('install', function(event) {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([
        '/favicon.svg'
      ]);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName !== CACHE_NAME;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener('push', function(event) {
  console.log('[SW] Push received:', event);

  let data = {
    title: 'SquadPlanner',
    body: 'Nouvelle notification',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    url: '/',
    actions: null,
    requireInteraction: true,
    vibrate: [100, 50, 100]
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        url: payload.url || data.url,
        tag: payload.tag || undefined,
        data: payload.data || {},
        actions: payload.actions || null,
        requireInteraction: payload.requireInteraction !== undefined ? payload.requireInteraction : data.requireInteraction,
        vibrate: payload.vibrate || data.vibrate
      };
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
    // Try to get text data
    if (event.data) {
      data.body = event.data.text();
    }
  }

  // Determiner les actions selon le type de notification
  let actions = [];

  if (data.data && data.data.type === 'incoming_call') {
    // Actions specifiques pour les appels entrants
    actions = [
      {
        action: 'answer',
        title: 'Repondre'
      },
      {
        action: 'decline',
        title: 'Refuser'
      }
    ];
    // Vibration type sonnerie pour les appels
    data.vibrate = [300, 100, 300, 100, 300];
    data.requireInteraction = true;
    console.log('[SW] Incoming call notification from:', data.data.caller_name);
  } else if (data.actions && Array.isArray(data.actions)) {
    // Utiliser les actions personnalisees si fournies
    actions = data.actions;
  } else {
    // Actions par defaut
    actions = [
      {
        action: 'open',
        title: 'Ouvrir'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ];
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag || 'squadplanner-notification',
    data: {
      url: data.url,
      ...data.data
    },
    vibrate: data.vibrate,
    requireInteraction: data.requireInteraction,
    actions: actions
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event.action);
  console.log('[SW] Notification data:', event.notification.data);

  const notificationData = event.notification.data || {};

  // Fermer la notification
  event.notification.close();

  // Gestion des actions pour les appels entrants
  if (notificationData.type === 'incoming_call') {
    const callId = notificationData.call_id;
    const callerId = notificationData.caller_id;

    console.log('[SW] Incoming call action:', event.action, 'callId:', callId);

    if (event.action === 'decline') {
      // Refuser l'appel - envoyer un message a l'app pour rejeter
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
          // Envoyer un message a tous les clients pour rejeter l'appel
          clientList.forEach(function(client) {
            client.postMessage({
              type: 'CALL_ACTION',
              action: 'decline',
              callId: callId,
              callerId: callerId
            });
          });

          // Si aucun client n'est ouvert, on doit quand meme gerer le refus
          // via une requete au serveur (optionnel, l'app gere via realtime)
          if (clientList.length === 0) {
            console.log('[SW] No clients open, decline will be handled when app opens');
          }
        })
      );
      return;
    }

    if (event.action === 'answer' || !event.action) {
      // Repondre a l'appel - ouvrir l'app sur l'ecran d'appel
      const urlToOpen = '/?incoming_call=' + callId + '&caller_id=' + callerId;

      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
          // Envoyer un message aux clients existants pour accepter l'appel
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if ('focus' in client) {
              client.focus();
              client.postMessage({
                type: 'CALL_ACTION',
                action: 'answer',
                callId: callId,
                callerId: callerId
              });
              return;
            }
          }
          // Si aucun client n'est ouvert, ouvrir l'app
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
      );
      return;
    }
  }

  // Gestion des autres types de notifications
  if (event.action === 'close') {
    return;
  }

  // Get the URL from notification data
  const urlToOpen = notificationData.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // If a window is already open, focus it and navigate
        if ('focus' in client) {
          client.focus();
          if (client.url !== urlToOpen) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', function(event) {
  console.log('[SW] Notification closed');
});

// Message event - handle messages from the main app
self.addEventListener('message', function(event) {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync event (for offline support)
self.addEventListener('sync', function(event) {
  console.log('[SW] Sync event:', event.tag);

  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      // Sync any pending notifications
      Promise.resolve()
    );
  }
});

console.log('[SW] Service worker loaded');
