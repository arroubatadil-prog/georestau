
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // <--- J'ai enlevé le ".tsx" ici, c'est souvent ça la cause !
import { I18nProvider } from './i18n';
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <I18nProvider>
    <App />
  </I18nProvider>,
)