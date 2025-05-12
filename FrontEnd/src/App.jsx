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

const savedTheme = localStorage.getItem('theme') || 'light-theme';
document.body.classList.add(savedTheme);


function App() {
  const { isHandGesture, showDisplay } = useContext(HandGestureContext);

  const { messaging } = useFirebase();

  useEffect(() => {
    const checkTokenChange = async () => {
      const newToken = await getToken(messaging, { vapidKey: import.meta.env.VITE_VAPID_KEY });
      const oldToken = localStorage.getItem("fcmToken");
      if (newToken === oldToken) {
        console.log("Token is the same");
      }
      if (newToken && newToken !== oldToken) {
        await sendFCMToken({ fcmToken: newToken }); // Update on server
        localStorage.setItem("fcmToken", newToken); // Update locally
      }
    };
    checkTokenChange();
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Message received. ", payload);
    });
    return unsubscribe;
    // const interval = setInterval(checkTokenChange, 1000 * 60 * 60 * 6); // Check every 6 hours
    // return () => clearInterval(interval);
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

                {isHandGesture && (
                  <HandMouseControl showDisplay={showDisplay} />
                )}

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
