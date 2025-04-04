import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import '../public/fontawesome-free/css/all.min.css'
import '../public/bootstrap/css/bootstrap.min.css'
// import '../public/bootstrap/js/bootstrap.bundle.min.js.map'
import '../public/js/bootstrap.bundle.min.js'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
