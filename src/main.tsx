import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/config/zod'
import './index.css'
// Yan etki importu: tema esitleme aboneligini React render'indan once kurar.
import './app/theme-sync'
import App from './App.tsx'

// index.html'deki <div id="root"> ile elle senkron tutulur (zod.ts TR locale'i bu
// noktada yuklenmemis olabilir — env.ts emsali: boot hatasi Turkce ve anlasilir).
const rootElement = document.getElementById('root')

if (rootElement === null) {
  throw new Error('Uygulama baslatılamadi: index.html icinde #root elemani bulunamadi.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
