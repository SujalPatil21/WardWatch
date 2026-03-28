import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { LiveDataProvider } from './context/LiveDataContext.jsx'

const path = window.location.pathname;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LiveDataProvider>
        <App />
      </LiveDataProvider>
    </BrowserRouter>
  </StrictMode>,
)
