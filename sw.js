// sw.js — PWA Instalable + Notificaciones Push en Banner (Android & iOS)

// 1. Activación inmediata
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// 2. Fetch requerido para instalar Web App (ignora POST para no interferir con tu backend)
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(() => new Response('Offline')));
});

// 3. Notificaciones Push optimizadas para bajar como banner
self.addEventListener('push', (event) => {
  let data = {
    title: 'S#1',
    body: 'Nueva actualización en tu panel.',
    url: '/panel.html'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.jpg',
      badge: '/icon.jpg',
      vibrate: [250, 100, 250],
      silent: false,
      tag: data.tag || `s1-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      data: { url: data.url || '/panel.html' }
    })
  );
});

// 4. Al tocar el banner: enfoca la app si ya está abierta o la abre directo en la ruta
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/panel.html';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
