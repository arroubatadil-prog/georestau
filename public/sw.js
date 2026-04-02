// Service Worker pour les notifications GeoResto
// Ce fichier gère les notifications push et les rend visibles dans le centre de notifications Windows

self.addEventListener('install', (event) => {
  console.log('✅ Service Worker installé');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activé');
  event.waitUntil(self.clients.claim());
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification cliquée:', event.notification.tag);
  
  event.notification.close();
  
  // Ouvrir ou focus la fenêtre de l'application
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, la focus
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon, ouvrir une nouvelle fenêtre
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Gérer la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Notification fermée:', event.notification.tag);
});

// Écouter les messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});
