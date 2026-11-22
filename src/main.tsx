import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Base tokens first: the feature pack's responsive/readability layer is the
// last stylesheet in the bundle and must be able to override them.
import './index.css'
import App from './App'

const root = document.getElementById('root')
if (!root) throw new Error('Root element missing from index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
