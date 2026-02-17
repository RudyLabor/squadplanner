// Service Worker for SquadPlanner — Push Notifications + Offline fallback
// IMPORTANT: No asset caching. Vercel CDN + browser HTTP cache handle that.
// The SW only exists for: push notifications, offline fallback page, background sync.

const SW_VERSION = '5.0';

// ── Lifecycle ──────────────────────────────────────────────────────────

self.addEventListener('install', function(event) {
  console.log('[SW] Installing v' + SW_VERSION);
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[SW] Activating v' + SW_VERSION);
  event.waitUntil(
    Promise.all([
      // Delete ALL old caches from previous SW versions
      caches.keys().then(function(names) {
        return Promise.all(
          names.filter(function(n) { return n.startsWith('squadplanner-'); })
               .map(function(n) {
                 console.log('[SW] Deleting old cache:', n);
                 return caches.delete(n);
               })
        );
      }),
      // Take control of all open pages immediately
      self.clients.claim()
    ])
  );
});

// ── Fetch — passthrough (no caching), offline fallback for navigation ──

self.addEventListener('fetch', function(event) {
  // Only intercept navigation requests to show offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response(
          '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Hors ligne</title><style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#050506;color:#f7f8f8}div{text-align:center;padding:2rem}.btn{display:inline-block;margin-top:1rem;padding:0.75rem 1.5rem;background:#6366f1;color:white;border-radius:0.5rem;text-decoration:none;cursor:pointer}</style></head><body><div><h1>Hors ligne</h1><p>Vérifie ta connexion internet</p><a class="btn" onclick="location.reload();return false;">Réessayer</a></div></body></html>',
          { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      })
    );
  }
  // All other requests pass through to the network directly (no SW interception)
});

// ── Push Notifications ─────────────────────────────────────────────────

self.addEventListener('push', function(event) {
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
    if (event.data) data.body = event.data.text();
  }

  // Actions based on notification type
  let actions = [];

  if (data.data && data.data.type === 'incoming_call') {
    actions = [
      { action: 'answer', title: 'Repondre' },
      { action: 'decline', title: 'Refuser' }
    ];
    data.vibrate = [300, 100, 300, 100, 300];
    data.requireInteraction = true;
  } else if (data.actions && Array.isArray(data.actions)) {
    actions = data.actions;
  } else {
    actions = [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' }
    ];
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag || 'squadplanner-notification',
      data: { url: data.url, ...data.data },
      vibrate: data.vibrate,
      requireInteraction: data.requireInteraction,
      actions: actions
    })
  );
});

// ── Notification Click ─────────────────────────────────────────────────

self.addEventListener('notificationclick', function(event) {
  const notificationData = event.notification.data || {};
  event.notification.close();

  // Incoming call handling
  if (notificationData.type === 'incoming_call') {
    const callId = notificationData.call_id;
    const callerId = notificationData.caller_id;

    if (event.action === 'decline') {
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
          clientList.forEach(function(client) {
            client.postMessage({ type: 'CALL_ACTION', action: 'decline', callId: callId, callerId: callerId });
          });
        })
      );
      return;
    }

    // Answer or default click
    const urlToOpen = '/?incoming_call=' + callId + '&caller_id=' + callerId;
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          if ('focus' in clientList[i]) {
            clientList[i].focus();
            clientList[i].postMessage({ type: 'CALL_ACTION', action: 'answer', callId: callId, callerId: callerId });
            return;
          }
        }
        if (clients.openWindow) return clients.openWindow(urlToOpen);
      })
    );
    return;
  }

  if (event.action === 'close') return;

  // Default: open or focus the app
  const urlToOpen = notificationData.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        if ('focus' in clientList[i]) {
          clientList[i].focus();
          if (clientList[i].url !== urlToOpen) clientList[i].navigate(urlToOpen);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});

self.addEventListener('notificationclose', function() {});

// ── Messages from the app ──────────────────────────────────────────────

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(function(names) {
        return Promise.all(
          names.filter(function(n) { return n.startsWith('squadplanner-'); })
               .map(function(n) { return caches.delete(n); })
        );
      }).then(function() {
        if (event.ports[0]) event.ports[0].postMessage({ success: true });
      })
    );
  }
});

// ── Background Sync — replay offline mutations ─────────────────────────

self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(replayOfflineMutations());
  }
});

async function replayOfflineMutations() {
  const DB_NAME = 'sq-offline-mutations';
  const STORE_NAME = 'mutations';
  try {
    const db = await new Promise(function(resolve, reject) {
      const req = indexedDB.open(DB_NAME, 1);
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function() { reject(req.error); };
    });
    const mutations = await new Promise(function(resolve, reject) {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = function() { resolve(req.result || []); };
      req.onerror = function() { reject(req.error); };
    });
    for (const mutation of mutations) {
      try {
        const response = await fetch(mutation.url, {
          method: mutation.method,
          headers: mutation.headers,
          body: mutation.body,
        });
        if (response.ok || response.status < 500) {
          await new Promise(function(resolve) {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(mutation.id);
            tx.oncomplete = function() { resolve(); };
            tx.onerror = function() { resolve(); };
          });
        }
      } catch (e) {
        break;
      }
    }
  } catch (e) { /* IndexedDB unavailable */ }
}

console.log('[SW] Service worker v' + SW_VERSION + ' loaded');
