import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { CartProvider } from './hooks/useCart'
import AppRoutes from './routes/AppRoutes'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}

export default App