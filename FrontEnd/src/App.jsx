import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AppRoute } from "./routes/AppRoute"
import { store } from "./store/reduxStore"
import { Provider } from "react-redux"

import { Error } from "./features/statusSlice/error/Error"
import { Loader } from "./features/statusSlice/loader/Loader"

import { PeerProvider } from "./context/PeerContext"
import { SocketProvider } from "./context/SocketContext"
import { useEffect } from "react"

document.body.classList.toggle('dark-theme', localStorage.getItem('theme') === 'dark');

function App() {
  
  return (
    <BrowserRouter>
      <Provider store={ store }>

        <SocketProvider>
          <PeerProvider>

            <AppRoute />
            <Error />
            <Loader />

          </PeerProvider>
        </SocketProvider>

      </Provider>
    </BrowserRouter>
  )
}

export default App
