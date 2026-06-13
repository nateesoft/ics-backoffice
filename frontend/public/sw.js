// ICS Backoffice — Push Notification Service Worker

self.addEventListener('push', function (event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'ICS Backoffice', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: '/ics-backoffice/icons/icon.svg',
    badge: '/ics-backoffice/icons/icon.svg',
    data: { url: data.url || '/ics-backoffice' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ICS Backoffice', options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/ics-backoffice';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        for (const client of clientList) {
          if (client.url.includes('/ics-backoffice') && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});
