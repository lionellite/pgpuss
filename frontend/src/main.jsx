import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import MotionProvider from './components/MotionProvider'
import './styles/global.css'
import './i18n/config'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <MotionProvider>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#0b1c30',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '0.875rem',
          boxShadow: '0 4px 6px -1px rgba(11,28,48,0.08)',
        },
        success: {
          iconTheme: { primary: '#004c4c', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#d32f2f', secondary: '#fff' },
        },
      }}
    />
    </MotionProvider>
  </BrowserRouter>
)
