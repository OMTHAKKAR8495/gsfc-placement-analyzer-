import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Register PWA Service Worker for Offline Caching
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New GSFC platform update detected. Refreshing app cache...');
                window.location.reload();
              }
            };
          }
        };
      })
      .catch((err) => console.log('PWA Service Worker registration skipped:', err));
  });
}

// Global Browser Safe-Guard to prevent total application crash from unhandled events
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.warn('🛡️ [Browser Safe Guard] Caught unhandled script error:', event.message || event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.warn('🛡️ [Browser Safe Guard] Caught unhandled promise rejection:', event.reason);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
