import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatMoney } from '../../utils/formatMoney'
import { formatDate } from '../../utils/formatDate'
import adminService from '../../services/admin.service'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeRentals: 0,
    totalCostumes: 0,
    totalUsers: 0
  })
  const [recentRentals, setRecentRentals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [rentalRes, costumeRes, userRes] = await Promise.all([
        adminService.getAllRentals(),
        adminService.getAllCostumes(),
        adminService.getAllUsers()
      ])

      const rentals = rentalRes.data.rentals

      // Tổng doanh thu
      const totalRevenue = rentals
        .filter(r => r.rental_status === 'completed')
        .reduce((sum, r) => sum + Number(r.total_amount_paid), 0)

      // Đơn đang thuê
      const activeRentals = rentals.filter(
        r => !['completed', 'cancelled'].includes(r.rental_status)
      ).length

      setStats({
        totalRevenue,
        activeRentals,
        totalCostumes: costumeRes.data.pagination.total,
        totalUsers: userRes.data.pagination.total
      })

      setRecentRentals(
        rentals.map(r => ({
          id: r.id,
          customer: `User #${r.user_id}`,
          amount: r.total_amount_paid,
          status: r.rental_status,
          date: r.created_at
        }))
      )
    } catch (error) {
      console.error('Dashboard mock error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => ({
    pending: 'bg-yellow-100 text-yellow-800',
    renting: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-200 text-gray-800'
  }[status] || 'bg-gray-100 text-gray-800')

  const getStatusLabel = (status) => ({
    pending: 'Chờ xử lý',
    renting: 'Đang thuê',
    completed: 'Hoàn thành',
    cancelled: 'Đã huỷ'
  }[status] || status)

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Bảng điều khiển</h1>

      {/* Thống kê */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Stat title="Tổng doanh thu" value={formatMoney(stats.totalRevenue)} />
        <Stat title="Đơn đang thuê" value={stats.activeRentals} />
        <Stat title="Trang phục" value={stats.totalCostumes} />
        <Stat title="Người dùng" value={stats.totalUsers} />
      </div>

      {/* Đơn thuê */}
      <table className="w-full bg-white shadow rounded">
        <tbody>
          {recentRentals.map(r => (
            <tr key={r.id} className="border-b">
              <td className="p-3">{r.id}</td>
              <td className="p-3">{r.customer}</td>
              <td className="p-3">{formatMoney(r.amount)}</td>
              <td className="p-3">
                <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(r.status)}`}>
                  {getStatusLabel(r.status)}
                </span>
              </td>
              <td className="p-3">{formatDate(r.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const Stat = ({ title, value }) => (
  <div className="bg-white p-5 rounded shadow">
    <p className="text-gray-500 text-sm">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
)

export default Dashboard
