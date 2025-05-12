import React, { createContext, useContext, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: "AIzaSyAkqZORD82uxBenXf9clePAT_MLy4v3oZY",
    authDomain: "pixr-54fa4.firebaseapp.com",
    projectId: "pixr-54fa4",
    storageBucket: "pixr-54fa4.firebasestorage.app",
    messagingSenderId: "892809315757",
    appId: "1:892809315757:web:7db1750233733c6bbacd24",
    measurementId: "G-90JRQJCYME"
};

const FirebaseContext = createContext();

export const FirebaseProvider = ({ children }) => {
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    // Register the service worker when the app loads
    useEffect(() => {
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
