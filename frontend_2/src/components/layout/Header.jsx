import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import Button from '../ui/Button'

const Header = () => {
  const { user, logout, isAdmin } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">

          {/* LEFT */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
              🎭 CostumeRental
            </Link>

            <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link to="/costumes" className="text-gray-700 hover:text-blue-600">
                Browse
              </Link>

              {user && (
                <Link to="/orders" className="text-gray-700 hover:text-blue-600">
                  My Orders
                </Link>
              )}

              {isAdmin && (
                <Link to="/admin" className="text-gray-700 hover:text-blue-600">
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* CART */}
                <Link to="/cart" className="relative">
                  <svg
                    className="w-6 h-6 text-gray-700 hover:text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>

                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* USER MENU */}
                  <div className="relative group">
                    <button
                      className="
                        flex items-center gap-2
                        rounded-full px-3 py-1.5
                        hover:bg-gray-100 transition
                        focus:outline-none
                      "
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>

                      {/* Name */}
                      <span className="hidden sm:block text-sm font-medium text-gray-700">
                        {user.name}
                      </span>

                      {/* Arrow */}
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* DROPDOWN */}
                    <div
                      className="
                        absolute right-0 mt-2 w-48
                        rounded-xl bg-white shadow-lg border
                        py-2
                        opacity-0 invisible
                        group-hover:opacity-100 group-hover:visible
                        transition-all duration-200
                      "
                    >
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        👤 Profile
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          🛠 Admin Dashboard
                        </Link>
                      )}

                      <div className="my-1 border-t" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </div>

              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header
