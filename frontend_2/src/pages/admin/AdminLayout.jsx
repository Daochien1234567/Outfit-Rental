import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/costumes', label: 'Costumes', icon: '👕' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/rentals', label: 'Rentals', icon: '📋' },
    { path: '/admin/deposits', label: 'Deposits', icon: '💰' },
    { path: '/admin/penalties', label: 'Penalties', icon: '⚖️' },
    { path: '/admin/reports/revenue', label: 'Reports', icon: '📈' },
  ]

  const reportSubItems = [
    { path: '/admin/reports/revenue', label: 'Revenue' },
    { path: '/admin/reports/top-costumes', label: 'Top Costumes' },
    { path: '/admin/reports/top-customers', label: 'Top Customers' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar toggle */}
      <div className="md:hidden bg-white shadow p-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600 hover:text-gray-900"
        >
          ☰
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 transition duration-200 ease-in-out
          w-64 bg-gray-800 text-white z-30
        `}>
          <div className="p-4">
            <h2 className="text-xl font-bold">Admin Panel</h2>
            <p className="text-gray-400 text-sm">Costume Rental System</p>
          </div>
          
          <nav className="mt-8">
            <ul className="space-y-2 px-4">
              {navItems.map(item => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/admin'}
                    className={({ isActive }) => `
                      flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'}
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                  
                  {item.label === 'Reports' && (
                    <ul className="ml-8 mt-2 space-y-1">
                      {reportSubItems.map(subItem => (
                        <li key={subItem.path}>
                          <NavLink
                            to={subItem.path}
                            className={({ isActive }) => `
                              block px-4 py-2 rounded text-sm transition-colors
                              ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}
                            `}
                            onClick={() => setSidebarOpen(false)}
                          >
                            {subItem.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
            
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 md:ml-0">
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout