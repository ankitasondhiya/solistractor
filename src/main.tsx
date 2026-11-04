import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App'
import { LanguageProvider } from './i18n/LanguageContext'
import { MotionProvider } from './motion/MotionContext'
import { EDITION } from './edition'

// Lets the stylesheets tell the two editions apart (see edition.ts).
document.documentElement.dataset.edition = EDITION

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('#root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <LanguageProvider>
      <MotionProvider>
        <App />
      </MotionProvider>
    </LanguageProvider>
  </StrictMode>,
)
