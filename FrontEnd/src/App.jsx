import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AppRoute } from "./routes/AppRoute"
import { store } from "./store/reduxStore"
import { Provider } from "react-redux"

import { Error } from "./features/statusSlice/error/Error"
import { Loader } from "./features/statusSlice/loader/Loader"

import { PeerProvider } from "./context/PeerContext"
import { SocketProvider } from "./context/SocketContext"
import { useContext, useEffect, useState } from "react"
import HandMouseControl from "./components/handgester/handTrack"
import HandGestureContext from "./context/HandContext"

import { Music } from "./features/music/music"

const savedTheme = localStorage.getItem('theme') || 'light-theme';
document.body.classList.add(savedTheme);

function App() {
  const { isHandGesture, showDisplay } = useContext(HandGestureContext);

  const [musicMainWindow, setMusicMainWindow] = useState(false);

  return (
    <BrowserRouter>
      <Provider store={store}>
        <SocketProvider>
          <PeerProvider>
            {isHandGesture && (
              <HandMouseControl showDisplay={showDisplay} />
            )}

              <AppRoute />
              <Error />
              <Loader />

              <Music musicMainWindow={musicMainWindow} setMusicMainWindow={setMusicMainWindow} />

          </PeerProvider>
        </SocketProvider>
      </Provider>
    </BrowserRouter>
  );
}

export default App;
