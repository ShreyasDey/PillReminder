/* Arogya Pharmacy Portal service worker — shows desktop notifications for
   restock reminders and new refill orders via Web Push, even when the portal
   tab is closed. Clicking focuses (or reopens) the portal. */

self.addEventListener('install', function () {
  self.skipWaiting();
});
self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  var payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (e) { payload = { title: 'Arogya Portal', body: event.data && event.data.text() }; }
  var title = payload.title || 'Arogya Portal';
  var options = {
    body: payload.body || '',
    tag: payload.tag || undefined,
    renotify: !!payload.tag,
    requireInteraction: !!payload.requireInteraction,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: Object.assign({ url: payload.url || '/' }, payload.data || {}),
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  var data = event.notification.data || {};
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clients) {
      for (var i = 0; i < clients.length; i++) {
        if ('focus' in clients[i]) return clients[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(data.url || '/');
    }),
  );
});
