import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/index.scss'

import { HandGestureProvider } from './context/HandContext.jsx'
import { FirebaseProvider } from "./context/FireBaseContext"


createRoot(document.getElementById('root')).render(
  <HandGestureProvider>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </HandGestureProvider>
)
