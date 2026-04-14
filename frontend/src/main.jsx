import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/global.css'
import './i18n/config'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#0F1E35',
          color: '#F0F4FF',
          border: '1px solid rgba(0,119,182,0.2)',
          borderRadius: '10px',
          fontSize: '0.875rem',
        },
        success: { iconTheme: { primary: '#06D6A0', secondary: '#0F1E35' } },
        error: { iconTheme: { primary: '#EF476F', secondary: '#0F1E35' } },
      }}
    />
  </BrowserRouter>
)
