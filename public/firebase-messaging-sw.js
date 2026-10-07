// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDbyRhpt-3QrA5M0ZG0xoOs30hzaxlvfCc",
  projectId: "proud-path-7224x",
  messagingSenderId: "329972602509",
  appId: "1:329972602509:web:65cd4ae61df8ea4e9074c4"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || '🚨 নতুন রেড জোন চাঁদাবাজি সতর্কতা!';
  const options = {
    body: payload.notification?.body || payload.data?.message || 'আপনার জেলায় একটি উচ্চ-ঝুঁকিপূর্ণ চাঁদাবাজি স্পট রিপোর্ট করা হয়েছে।',
    icon: 'https://i.ibb.co.com/vCMSKN3d/user-icon-simple-design-free-vector.jpg',
    badge: 'https://i.ibb.co.com/vCMSKN3d/user-icon-simple-design-free-vector.jpg',
    vibrate: [200, 100, 200, 100, 200],
    data: payload.data
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
