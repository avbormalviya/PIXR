import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AppRoute } from "./routes/AppRoute"
import { store } from "./store/reduxStore"
import { Provider, useSelector } from "react-redux"

import { Error } from "./features/statusSlice/error/Error"
import { Loader } from "./features/statusSlice/loader/Loader"

import { PeerProvider } from "./context/PeerContext"
import { SocketProvider } from "./context/SocketContext"
import { useContext, useEffect, useState } from "react"
import HandMouseControl from "./components/handgester/handTrack"
import HandGestureContext from "./context/HandContext"

import { sendFCMToken } from "./utils/sendFCMToken"
import { getToken } from "firebase/messaging"
import { useFirebase } from "./context/FireBaseContext"
import { onMessage } from "firebase/messaging";

import { IncomingCallModal } from "./components/notifications/IncomingCallModal"
import { ToastContainer } from "./components/notifications/ToastContainer"
import { PwaInstallPrompt } from "./components/notifications/PwaInstallPrompt"

const savedTheme = localStorage.getItem('theme') || 'light-theme';
document.body.classList.add(savedTheme);


function App() {
  const { isHandGesture, showDisplay } = useContext(HandGestureContext);

  const { messaging } = useFirebase();

  useEffect(() => {
    // Send immediate silent warm-up ping to backend (prevents Render cold start delays)
    fetch(`${import.meta.env.VITE_BACKEND_URL}/ping`).catch(() => {});

    const checkTokenChange = async () => {
      try {
        let registration;
        if ('serviceWorker' in navigator) {
          registration = await navigator.serviceWorker.ready;
        }
        const newToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_VAPID_KEY,
          ...(registration && { serviceWorkerRegistration: registration })
        });
        const oldToken = localStorage.getItem("fcmToken");
        if (newToken && newToken !== oldToken) {
          await sendFCMToken({ fcmToken: newToken }); // Update on server
          localStorage.setItem("fcmToken", newToken); // Update locally
        }
      } catch (e) {
        console.warn("FCM token request error:", e);
      }
    };
    checkTokenChange();
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground FCM message received: ", payload);
    });
    return unsubscribe;
  }, [messaging]);

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Provider store={store}>
        <SocketProvider>
          <PeerProvider>

                {isHandGesture && (
                  <HandMouseControl showDisplay={showDisplay} />
                )}

                <IncomingCallModal />
                <ToastContainer />
                <PwaInstallPrompt />

                <AppRoute />
                <Error />
                <Loader />
          </PeerProvider>
        </SocketProvider>
      </Provider>
    </BrowserRouter>
  );
}

export default App;
