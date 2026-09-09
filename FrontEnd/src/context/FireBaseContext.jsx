import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const FirebaseContext = createContext();

export const FirebaseProvider = ({ children }) => {
    const [messaging, setMessaging] = useState(null);

    useEffect(() => {
        // Initialize Firebase App + messaging if supported
        (async () => {
            try {
                const app = initializeApp(firebaseConfig);
                const supported = await isSupported().catch(() => false);
                if (supported) {
                    setMessaging(getMessaging(app));
                }
            } catch (e) {
                console.error("Firebase init error:", e);
            }
        })();

        // Register service worker for background notifications
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/firebase-messaging-sw.js')
                .then(function(registration) {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(function(error) {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }, []);

    return (
        <FirebaseContext.Provider value={{ messaging }}>
            {children}
        </FirebaseContext.Provider>
    );
};

export const useFirebase = () => useContext(FirebaseContext);
