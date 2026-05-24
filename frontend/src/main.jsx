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
        duration: 4000,
        style: {
          background: '#fff',
          color: '#1a1a1a',
          border: '1px solid #dcdcdc',
          borderRadius: '4px',
          fontSize: '0.875rem',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)',
        },
        success: {
          iconTheme: { primary: '#008751', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#e8112d', secondary: '#fff' },
        },
      }}
    />
  </BrowserRouter>
)
