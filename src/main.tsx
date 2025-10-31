import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <-- Import the router
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Wrap the App component with the router */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)