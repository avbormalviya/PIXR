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
    if (!event.data) return;

    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = { notification: { title: "PIXR Notification", body: event.data.text() } };
    }

    const payload = data.notification || data.data || data;
    const title = payload.title || "PIXR Alert";
    const isCall = payload.type === 'incoming_call' || payload.title?.toLowerCase().includes('call');

    const options = {
        body: payload.body || "You have a new update in PIXR",
        icon: '/icon_400.png',
        badge: '/icon_100.png',
        data: {
            url: payload.url || (payload.senderId ? `/chat` : '/')
        },
        requireInteraction: isCall,
        vibrate: isCall ? [500, 250, 500, 250, 500] : [200, 100, 200],
        tag: isCall ? 'incoming-call' : 'pixr-notification'
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

const messaging = firebase.messaging();
