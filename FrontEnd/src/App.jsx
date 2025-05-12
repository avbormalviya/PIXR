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

import { FirebaseProvider } from "./context/FireBaseContext"
import { sendFCMToken } from "./utils/sendFCMToken"

const savedTheme = localStorage.getItem('theme') || 'light-theme';
document.body.classList.add(savedTheme);

function App() {
  const { isHandGesture, showDisplay } = useContext(HandGestureContext);


  useEffect(() => {
    const checkTokenChange = async () => {
      const newToken = await getToken(messaging, { vapidKey: import.meta.env.VITE_VAPID_KEY });
      const oldToken = localStorage.getItem("fcmToken");

      if (newToken && newToken !== oldToken) {
        await sendFCMToken(newToken); // Update on server
        localStorage.setItem("fcmToken", newToken); // Update locally
      }
    };

    const interval = setInterval(checkTokenChange, 1000 * 60 * 60 * 6); // Check every 6 hours

    return () => clearInterval(interval);
  }, []);

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
            <FirebaseProvider>
                {isHandGesture && (
                  <HandMouseControl showDisplay={showDisplay} />
                )}

                <AppRoute />
                <Error />
                <Loader />
            </FirebaseProvider>
          </PeerProvider>
        </SocketProvider>
      </Provider>
    </BrowserRouter>
  );
}

export default App;
