import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Your tailwind styles
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './context/CartContext' // <--- CRITICAL IMPORT

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider> {/* <--- CRITICAL WRAPPER: Must be outside App */}
        <App />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>,
)