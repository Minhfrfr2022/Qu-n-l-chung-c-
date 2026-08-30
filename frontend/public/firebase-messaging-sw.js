/* eslint-disable no-undef */
// Scripts for firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Default config - matches frontend/lib/firebase.ts
firebase.initializeApp({
  apiKey: "AIzaSyDummyKeyForDevelopment12345678",
  authDomain: "bluemoon-building.firebaseapp.com",
  projectId: "bluemoon-building",
  storageBucket: "bluemoon-building.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
});

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (e) {
  console.warn('Service worker messaging init fallback', e);
}

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message: ', payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || 'BQL BlueMoon Thông Báo';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'Bạn có thông báo mới từ ban quản lý.',
      icon: payload.notification?.icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: payload.data || {},
      tag: payload.data?.category || 'bluemoon-notification',
      renotify: true,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle notification click to open tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.link || event.notification.data?.click_action || '/bills';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // If not open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
