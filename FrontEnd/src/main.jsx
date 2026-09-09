import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/index.scss'

import { HandGestureProvider } from './context/HandContext.jsx'
import { FirebaseProvider } from "./context/FireBaseContext"
import { Provider } from 'react-redux'
import { store } from './store/reduxStore'


createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <HandGestureProvider>
      <FirebaseProvider>
        <App />
      </FirebaseProvider>
    </HandGestureProvider>
  </Provider>
)
