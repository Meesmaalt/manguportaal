import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import { getConfig } from '@/lib/config'

const { basePath } = getConfig()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basePath || undefined}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
