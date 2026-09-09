import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AppRoute } from "./routes/AppRoute"
import { useSelector } from "react-redux"

import { Error } from "./features/statusSlice/error/Error"
import { Loader } from "./features/statusSlice/loader/Loader"

import { PeerProvider } from "./context/PeerContext"
import { SocketProvider } from "./context/SocketContext"
import { useContext, useEffect } from "react"
import HandMouseControl from "./components/handgester/handTrack"
import HandGestureContext from "./context/HandContext"

import { sendFCMToken } from "./utils/sendFCMToken"
import { getToken } from "firebase/messaging"
import { useFirebase } from "./context/FireBaseContext"
import { onMessage } from "firebase/messaging";

import { IncomingCallModal } from "./components/notifications/IncomingCallModal"
import { ToastContainer } from "./components/notifications/ToastContainer"
import { PwaInstallPrompt } from "./components/notifications/PwaInstallPrompt"
import { showToast } from "./utils/toast"
import { useDispatch } from "react-redux"
import { setNotification } from "./features/user/useSlice"

const savedTheme = localStorage.getItem('theme') || 'light-theme';
document.body.classList.add(savedTheme);


function App() {
  const { isHandGesture, showDisplay } = useContext(HandGestureContext);

  const { messaging } = useFirebase();

  const { user } = useSelector((state) => state.user);

  const dispatch = useDispatch();

  useEffect(() => {
    // Send immediate silent warm-up ping to backend (prevents Render cold start delays)
    fetch(`${import.meta.env.VITE_BACKEND_URL}/ping`).catch(() => {});

    // messaging is initialised asynchronously in FirebaseContext; skip FCM work
    // until it's ready. The effect will re-run automatically once messaging is set.
    if (!messaging) return;

    const checkTokenChange = async () => {
      try {
        // Only request FCM token if user is logged in AND has granted notification permission.
        if (!user) return;

        if (typeof Notification === "undefined" || Notification.permission !== "granted") {
          console.log("🔕 Notification permission not granted, skipping FCM token request");
          return;
        }

        let registration;
        if ('serviceWorker' in navigator) {
          registration = await navigator.serviceWorker.ready;
        }
        const newToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_VAPID_KEY,
          ...(registration && { serviceWorkerRegistration: registration })
        });
        if (!newToken) return;

        const oldToken = localStorage.getItem("fcmToken");
        if (newToken !== oldToken) {
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

      // Show a toast for incoming foreground notifications
      const notif = payload?.notification || payload?.data;
      if (notif) {
        const isCall = notif?.type === "incoming_call"
          || (notif?.title || "").toLowerCase().includes("call");

        showToast({
          title: notif.title || "PIXR",
          body: notif.body || "You have a new update",
          type: isCall ? "error" : "info",
          avatar: notif.icon || undefined,
          link: notif.url || (notif.senderId ? "/chat" : "/notifications"),
          duration: isCall ? 15000 : 4500,
        });

        if (!isCall) {
          // Update notification badge in navbar
          dispatch(setNotification(true));
          localStorage.setItem("notification", "true");
        }
      }
    });
    return unsubscribe;
  }, [messaging, user, dispatch]);

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
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
    </BrowserRouter>
  );
}

export default App;
