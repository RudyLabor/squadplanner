// Service Worker for SquadPlanner - Performance & Push Notifications
// This runs in the background and handles push events even when the app is closed

// Cache version - UPDATE THIS ON EACH DEPLOYMENT
const CACHE_VERSION = 'v3';
const STATIC_CACHE = `squadplanner-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `squadplanner-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `squadplanner-images-${CACHE_VERSION}`;

// Maximum age for dynamic cache entries (15 minutes)
const DYNAMIC_CACHE_MAX_AGE = 15 * 60 * 1000;

// Maximum cache size (50 entries)
const MAX_CACHE_ENTRIES = 50;

// Static assets to precache — PHASE 5: expanded for faster repeat visits
const STATIC_ASSETS = [
  '/favicon.svg',
  '/vite.svg',
  '/critical.css',
  '/manifest.json',
  '/icon-192.png'
];

// Install event - cache essential assets
self.addEventListener('install', function(event) {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      console.log('[SW] Precaching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up ALL old caches and take control
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          // Delete ANY cache that doesn't match current version
          return cacheName.startsWith('squadplanner-') &&
                 cacheName !== STATIC_CACHE &&
                 cacheName !== DYNAMIC_CACHE &&
                 cacheName !== IMAGE_CACHE;
        }).map(function(cacheName) {
          console.log('[SW] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      // Also clean up any corrupted entries in current caches
      return cleanupCaches();
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Clean up corrupted or expired cache entries
async function cleanupCaches() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    const now = Date.now();

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        // Check if response has metadata header with timestamp
        const cachedAt = response.headers.get('sw-cached-at');
        if (cachedAt) {
          const age = now - parseInt(cachedAt, 10);
          if (age > DYNAMIC_CACHE_MAX_AGE) {
            console.log('[SW] Removing expired cache entry:', request.url);
            await cache.delete(request);
          }
        }
      }
    }

    // Limit cache size
    const remainingRequests = await cache.keys();
    if (remainingRequests.length > MAX_CACHE_ENTRIES) {
      const toDelete = remainingRequests.slice(0, remainingRequests.length - MAX_CACHE_ENTRIES);
      for (const request of toDelete) {
        await cache.delete(request);
      }
      console.log('[SW] Trimmed cache to', MAX_CACHE_ENTRIES, 'entries');
    }
  } catch (error) {
    console.error('[SW] Error cleaning up caches:', error);
  }
}

// Fetch event - smart caching strategies
self.addEventListener('fetch', function(event) {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Supabase API calls - NEVER cache API data
  if (url.hostname.includes('supabase')) return;

  // Skip chrome-extension
  if (url.protocol === 'chrome-extension:') return;

  // Skip WebSocket and EventSource
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return;

  // CRITICAL: Never cache HTML navigation requests (SPA routes)
  // This prevents the "black screen" issue from corrupted cached HTML
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Handle different request types
  if (isStaticAsset(url)) {
    // Static assets: Cache first (JS, CSS, fonts with hash in filename)
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isImageRequest(request, url)) {
    // Images: Cache first with validation
    event.respondWith(cacheFirstWithValidation(request, IMAGE_CACHE));
  } else if (url.origin === self.location.origin) {
    // Other same-origin requests: Network first with cache fallback
    event.respondWith(networkFirst(request));
  }
});

// Check if static asset (versioned files are safe to cache long-term)
function isStaticAsset(url) {
  // Match hashed assets like main.abc123.js
  return /\.(js|css|woff2?|ttf|otf)$/.test(url.pathname) &&
         (/[.-][a-f0-9]{8,}\./.test(url.pathname) || url.pathname.includes('/assets/'));
}

// Check if image request
function isImageRequest(request, url) {
  return request.destination === 'image' ||
         /\.(png|jpg|jpeg|gif|svg|webp|ico|avif)$/.test(url.pathname);
}

// Validate response before caching
function isValidResponse(response) {
  // Must be a successful response
  if (!response || !response.ok) return false;

  // Must have valid status (200-299)
  if (response.status < 200 || response.status >= 300) return false;

  // Check Content-Type for HTML/JSON responses
  const contentType = response.headers.get('content-type') || '';

  // Don't cache error pages disguised as HTML
  if (contentType.includes('text/html')) {
    // For HTML, we're being very strict - only cache if truly valid
    return response.status === 200;
  }

  return true;
}

// Network First strategy (for HTML and dynamic content)
async function networkFirst(request) {
  try {
    const response = await fetch(request);

    // Only return valid responses
    if (isValidResponse(response)) {
      return response;
    }

    // If network response is invalid, try cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return the network response anyway (let the app handle the error)
    return response;
  } catch (error) {
    // Network failed, try cache
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Serving from cache (offline):', request.url);
      return cached;
    }

    // For navigation requests, return a basic offline page
    if (request.mode === 'navigate') {
      return new Response(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Hors ligne</title><style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#050506;color:#f7f8f8}div{text-align:center;padding:2rem}.btn{display:inline-block;margin-top:1rem;padding:0.75rem 1.5rem;background:#6366f1;color:white;border-radius:0.5rem;text-decoration:none}</style></head><body><div><h1>Hors ligne</h1><p>Vérifie ta connexion internet</p><a href="/" class="btn" onclick="location.reload();return false;">Réessayer</a></div></body></html>',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    return new Response('Offline', { status: 503 });
  }
}

// Cache First strategy (for static assets)
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);

    // Only cache valid responses
    if (isValidResponse(response)) {
      const responseToCache = response.clone();
      const cache = await caches.open(cacheName);
      cache.put(request, responseToCache);
    }

    return response;
  } catch (error) {
    console.error('[SW] Fetch failed for static asset:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// Cache First with validation (for images)
async function cacheFirstWithValidation(request, cacheName) {
  const cached = await caches.match(request);

  if (cached) {
    // Validate cached response isn't corrupted
    const contentLength = cached.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 0) {
      return cached;
    }
    // If corrupted, delete and fetch fresh
    const cache = await caches.open(cacheName);
    await cache.delete(request);
  }

  try {
    const response = await fetch(request);

    // Validate before caching
    if (isValidResponse(response)) {
      const contentLength = response.headers.get('content-length');
      // Only cache if we have content
      if (!contentLength || parseInt(contentLength, 10) > 0) {
        const responseToCache = response.clone();
        const cache = await caches.open(cacheName);
        cache.put(request, responseToCache);
      }
    }

    return response;
  } catch (error) {
    // Return cached even if potentially stale
    if (cached) return cached;
    return new Response('Offline', { status: 503 });
  }
}

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

  // Allow app to clear cache on demand
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.filter(function(cacheName) {
            return cacheName.startsWith('squadplanner-');
          }).map(function(cacheName) {
            console.log('[SW] Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(function() {
        // Notify the app that cache was cleared
        event.ports[0]?.postMessage({ success: true });
      })
    );
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

console.log('[SW] Service worker loaded - version', CACHE_VERSION);
