import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/index.scss'

import { HandGestureProvider } from './context/HandContext.jsx'

createRoot(document.getElementById('root')).render(
  <HandGestureProvider><App /></HandGestureProvider>
)
