import React from 'react'
import ReactDOM from 'react-dom/client'
import 'virtual:uno.css' // UnoCSS 原子化样式
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})
