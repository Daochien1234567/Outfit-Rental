import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../utils/formatDate'
import { formatMoney } from '../../utils/formatMoney'
import Button from '../../components/ui/Button'
import rentalService from '../../services/rental.service'

const Profile = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    activeRentals: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    setLoading(true)
    try {
      // Get user's rentals to calculate stats
      const response = await rentalService.getRentals({ limit: 100 })
      const rentals = response.rentals || []
      
      const totalOrders = rentals.length
      const totalSpent = rentals.reduce((sum, rental) => sum + Number(rental.total_amount_paid), 0)
      const activeRentals = rentals.filter(r => 
        ['pending', 'confirmed', 'out_for_delivery', 'renting'].includes(r.rental_status)
      ).length
      
      setStats({
        totalOrders,
        totalSpent,
        activeRentals
      })
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Thông tin cá nhân</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold">Thông tin cá nhân</h2>
                <p className="text-gray-600">Quản lý thông tin cá nhân của bạn</p>
              </div>
              <Link to="/profile/update">
                <Button variant="outline" size="sm">Chỉnh sửa</Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Họ tên</p>
                <p className="font-medium">{user?.name || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user?.email || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Số điện thoại</p>
                <p className="font-medium">{user?.phone || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Địa chỉ</p>
                <p className="font-medium">{user?.address || 'Chưa cập nhật'}</p>
              </div>
              {user?.createdAt && (
                <div>
                  <p className="text-sm text-gray-600">Thành viên từ</p>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Account Security */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Bảo mật tài khoản</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Mật khẩu</p>
                  <p className="text-sm text-gray-600">Cập nhật lần cuối cách đây 2 ngày</p>
                </div>
                <Link to="/profile/change-password">
                  <Button variant="outline" size="sm">Đổi mật khẩu</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-blue-600 font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-bold">{user?.name}</h3>
              <p className="text-gray-600">{user?.email}</p>
            </div>

            {/* Stats */}
            {loading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                      <p className="text-2xl font-bold">{stats.totalOrders}</p>
                    </div>
                    <div className="text-green-600">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Tổng chi tiêu</p>
                      <p className="text-2xl font-bold">
                        {(stats.totalSpent)}
                      </p>
                    </div>
                    <div className="text-blue-600">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Đơn đang thuê</p>
                      <p className="text-2xl font-bold">{stats.activeRentals}</p>
                    </div>
                    <div className="text-purple-600">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="font-semibold mb-4">Thao tác nhanh</h3>
              <div className="space-y-2">
                <Link to="/orders">
                  <Button variant="outline" fullWidth>
                    Xem đơn hàng
                  </Button>
                </Link>
                <Link to="/costumes">
                  <Button variant="outline" fullWidth>
                    Thuê thêm
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile