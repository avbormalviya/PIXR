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
  const payload = event.data.json();
  const { title, ...options } = payload.notification;

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

const messaging = firebase.messaging();
