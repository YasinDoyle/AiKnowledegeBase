import React from 'react'
import ReactDOM from 'react-dom/client'
import 'virtual:uno.css'
import '@/assets/base.scss'
import '@/assets/theme'
import '@/i18n'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
