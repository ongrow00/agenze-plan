import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootEl = document.getElementById('root')!
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem;font-family:system-ui,sans-serif;max-width:32rem;margin:0 auto;line-height:1.5">
      <div>
        <h1 style="font-size:1.125rem;font-weight:600;margin:0 0 0.5rem">Configuração do Supabase</h1>
        <p style="margin:0;color:#666">
          O build não incluiu <code style="font-size:0.9em">VITE_SUPABASE_URL</code> e <code style="font-size:0.9em">VITE_SUPABASE_ANON_KEY</code>.
          Na Vercel: <strong>Project → Settings → Environment Variables</strong>, adiciona as duas para <strong>Production</strong> e faz <strong>Redeploy</strong>
          (o Vite só incorpora essas variáveis na hora do build).
        </p>
      </div>
    </div>`
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
