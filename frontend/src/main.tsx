import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import { getConfig } from '@/lib/config'
import { I18nProvider } from '@/i18n/I18nContext'

const { basePath } = getConfig()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <BrowserRouter basename={basePath || undefined}>
        <App />
      </BrowserRouter>
    </I18nProvider>
  </React.StrictMode>,
)
