import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AdminRoutes from './AdminRoutes'

// Layout Components

import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

// Pages
import Home from '../pages/home/Home'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import CostumeList from '../pages/costumes/CostumeList'
import CostumeDetail from '../pages/costumes/CostumeDetail'
import Cart from '../pages/cart/Cart'
import Checkout from '../pages/checkout/Checkout'
import PaymentResult from '../pages/checkout/PaymentResult'
import OrderList from '../pages/orders/OrderList'
import OrderDetail from '../pages/orders/OrderDetail'
import Profile from '../pages/profile/Profile'
import UpdateProfile from '../pages/profile/UpdateProfile'
import ChangePassword from '../pages/profile/ChangePassword'

const PrivateRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" />
  }
  
  return children
}

const AppRoutes = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/costumes" element={<CostumeList />} />
          <Route path="/costumes/:id" element={<CostumeDetail />} />
          
          {/* Protected routes */}
          <Route path="/cart" element={
            <PrivateRoute>
              <Cart />
            </PrivateRoute>
          } />
          <Route path="/checkout" element={
            <PrivateRoute>
              <Checkout />
            </PrivateRoute>
          } />
          <Route path="/payment-result" element={
            <PrivateRoute>
              <PaymentResult />
            </PrivateRoute>
          } />
          <Route path="/orders" element={
            <PrivateRoute>
              <OrderList />
            </PrivateRoute>
          } />
          <Route path="/orders/:id" element={
            <PrivateRoute>
              <OrderDetail />
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />
          <Route path="/profile/update" element={
            <PrivateRoute>
              <UpdateProfile />
            </PrivateRoute>
          } />
          <Route path="/profile/change-password" element={
            <PrivateRoute>
              <ChangePassword />
            </PrivateRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin/*" element={
            <PrivateRoute requireAdmin>
              <AdminRoutes />
            </PrivateRoute>
          } />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default AppRoutes