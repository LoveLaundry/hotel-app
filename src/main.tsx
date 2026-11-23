import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Base tokens first, then the canonical LoveLaundry theme layer. The feature
// pack's responsive/readability CSS is imported by its provider and therefore
// still lands last in the bundle.
import './index.css'
import './ll-design-tokens.css'
import App from './App'
import { ThemeProvider } from './ll-theme'

const root = document.getElementById('root')
if (!root) throw new Error('Root element missing from index.html')

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
