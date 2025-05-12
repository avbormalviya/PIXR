// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAkqZORD82uxBenXf9clePAT_MLy4v3oZY",
    authDomain: "pixr-54fa4.firebaseapp.com",
    projectId: "pixr-54fa4",
    storageBucket: "pixr-54fa4.firebasestorage.app",
    messagingSenderId: "892809315757",
    appId: "1:892809315757:web:7db1750233733c6bbacd24",
});

self.addEventListener('push', function(event) {
    const data = event.data.json();
    console.log('Push event received:', data);
    const options = {
        body: data.body,
        icon: '/icon_400.png',
        badge: '/icon_100.png', 
        image: '/icon_1600.png', // Large image below the notification body
        actions: [            // Custom action buttons
            {
                action: 'open_app',
                title: 'Open App',
                icon: '/open-icon.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/dismiss-icon.png'
            }
        ],
        data: {
            url: data.url || '/' // Custom data (e.g., URL to open on click)
        },
        requireInteraction: true, // Keeps the notification until the user interacts
        vibrate: [200, 100, 200], // Vibration pattern
        tag: 'message-group-1'    // Groups/updates notifications with the same tag
    };


      event.waitUntil(
          self.registration.showNotification(data.notification.title, options)
      );
  });

  self.addEventListener('notificationclick', function(event) {
      event.notification.close();
      const targetUrl = event.notification.data?.url || '/';
      event.waitUntil(
          clients.openWindow(targetUrl)
      );
  });

const messaging = firebase.messaging();
