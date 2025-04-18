import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AppRoute } from "./routes/AppRoute"
import { store } from "./store/reduxStore"
import { Provider, useSelector } from "react-redux"

import { Error } from "./features/statusSlice/error/Error"
import { Loader } from "./features/statusSlice/loader/Loader"

import { PeerProvider } from "./context/PeerContext"
import { SocketProvider } from "./context/SocketContext"

const savedTheme = localStorage.getItem('theme') || 'light-theme';
document.body.classList.add(savedTheme);

function App() {

  return (
    <BrowserRouter>
      <Provider store={store}>
        <SocketProvider>
          <PeerProvider>

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
