/* SaathiPill service worker — delivers medication reminders via Web Push, even
   when the app tab is closed. Reminder actions open the app to mark the dose. */

self.addEventListener('install', function () {
  self.skipWaiting();
});
self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  var payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (e) { payload = { title: 'SaathiPill', body: event.data && event.data.text() }; }
  var title = payload.title || 'SaathiPill reminder';
  var options = {
    body: payload.body || '',
    tag: payload.tag || undefined,            // a new reminder for the same dose replaces the old one
    renotify: !!payload.tag,
    requireInteraction: !!payload.requireInteraction, // stays until the user acts
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: Object.assign({ url: payload.url || '/' }, payload.data || {}),
    actions: payload.actions || [],
    vibrate: [120, 60, 120],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  var data = event.notification.data || {};
  var action = event.action || 'open';
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clients) {
      var msg = { type: 'dose-action', doseId: data.doseId || null, action: action, kind: data.kind || null };
      for (var i = 0; i < clients.length; i++) {
        if ('focus' in clients[i]) {
          clients[i].postMessage(msg);
          return clients[i].focus();
        }
      }
      // No open tab → open one and pass the action via the URL hash.
      var url = (data.url || '/') + (data.doseId ? ('#dose=' + data.doseId + '&action=' + action) : '');
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
