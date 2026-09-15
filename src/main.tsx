import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/config/zod'
import './index.css'
// Yan etki importu: tema esitleme aboneligini React render'indan once kurar.
import './app/theme-sync'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
