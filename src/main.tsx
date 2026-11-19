import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import 'katex/dist/katex.min.css'
import './theme/tokens.css'
import './theme/app.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
