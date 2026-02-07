import { useEffect, useState } from 'react'
import { formatMoney } from '../../../utils/formatMoney'
import { formatDate } from '../../../utils/formatDate'
import Button from '../../../components/ui/Button'
import adminService from '../../../services/admin.service'

const TopCustomers = () => {
  const [timeRange, setTimeRange] = useState('all')
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [stats, setStats] = useState({
    totalRevenue: null,
    avgCustomerValue: null,
    totalOrders: null,
    customerCount: 0
  })

  useEffect(() => {
    fetchTopCustomers()
  }, [timeRange])

  const fetchTopCustomers = async () => {
    setLoading(true)
    try {
      const res = await adminService.getTopCustomers({
        limit: 10,
        timeRange
      })

      if (res.success && Array.isArray(res.data)) {
        // ✅ Chuẩn hóa đúng theo QUERY – KHÔNG gán số giả
        const normalizedCustomers = res.data.map((c) => ({
          id: c.id,
          full_name: c.full_name || 'Khách hàng',
          email: c.email || '',
          phone: c.phone || '',
          total_spent: c.total_spent != null ? Number(c.total_spent) : null,
          completed_rentals: c.completed_rentals != null ? Number(c.completed_rentals) : null,
          avg_spent_per_rental: c.avg_spent_per_rental != null ? Number(c.avg_spent_per_rental) : null,
          last_rental_date: c.last_rental_date || null
        }))

        setCustomers(normalizedCustomers)
        calculateStats(normalizedCustomers)
      } else {
        setCustomers([])
      }
    } catch (error) {
      console.error('Error fetching top customers:', error)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (list) => {
    if (!list.length) {
      setStats({
        totalRevenue: null,
        avgCustomerValue: null,
        totalOrders: null,
        customerCount: 0
      })
      return
    }

    const revenueList = list.filter(c => c.total_spent != null)
    const orderList = list.filter(c => c.completed_rentals != null)

    const totalRevenue = revenueList.length
      ? revenueList.reduce((sum, c) => sum + c.total_spent, 0)
      : null

    const totalOrders = orderList.length
      ? orderList.reduce((sum, c) => sum + c.completed_rentals, 0)
      : null

    const avgCustomerValue =
      totalRevenue != null ? totalRevenue / list.length : null

    setStats({
      totalRevenue,
      avgCustomerValue,
      totalOrders,
      customerCount: list.length
    })
  }

  const getTimeRangeLabel = (range) => ({
    all: 'Tất cả',
    week: 'Tuần',
    month: 'Tháng',
    quarter: 'Quý',
    year: 'Năm'
  }[range] || range)

  // 👉 Detect cột có dữ liệu hay không
  const showAvg = customers.some(c => c.avg_spent_per_rental != null)
  const showLastRental = customers.some(c => c.last_rental_date != null)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Khách hàng hàng đầu</h1>
          <p className="text-gray-600">Phân tích chi tiêu và hiệu suất</p>
        </div>

        <div className="flex gap-2">
          {['all', 'month', 'quarter', 'year'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {getTimeRangeLabel(range)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          {/* Thống kê – CHỈ HIỂN THỊ KHI CÓ DỮ LIỆU */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {stats.totalRevenue != null && (
              <Stat
                label="Tổng doanh thu"
                value={formatMoney(stats.totalRevenue)}
                color="text-green-600"
              />
            )}

            {stats.avgCustomerValue != null && (
              <Stat
                label="Giá trị TB/KH"
                value={formatMoney(stats.avgCustomerValue)}
              />
            )}

            {stats.totalOrders != null && (
              <Stat
                label="Tổng đơn hoàn thành"
                value={stats.totalOrders}
              />
            )}

            <Stat
              label="Số khách hàng"
              value={stats.customerCount}
            />
          </div>

          {/* Bảng */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">#</th>
                  <th className="px-6 py-3 text-left">Khách hàng</th>
                  <th className="px-6 py-3 text-left">Tổng chi tiêu</th>
                  <th className="px-6 py-3 text-left">Đơn hoàn thành</th>
                  {showAvg && <th className="px-6 py-3 text-left">TB/đơn</th>}
                  {showLastRental && <th className="px-6 py-3 text-left">Thuê gần nhất</th>}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  customers.map((c, i) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{i + 1}</td>

                      <td className="px-6 py-4">
                        <div className="font-medium">{c.full_name}</div>
                        <div className="text-sm text-gray-500">{c.email}</div>
                      </td>

                      <td className="px-6 py-4 font-bold text-green-600">
                        {c.total_spent != null ? formatMoney(c.total_spent) : '—'}
                      </td>

                      <td className="px-6 py-4">
                        {c.completed_rentals != null ? c.completed_rentals : '—'}
                      </td>

                      {showAvg && (
                        <td className="px-6 py-4">
                          {c.avg_spent_per_rental != null
                            ? formatMoney(c.avg_spent_per_rental)
                            : '—'}
                        </td>
                      )}

                      {showLastRental && (
                        <td className="px-6 py-4 text-sm">
                          {c.last_rental_date
                            ? formatDate(c.last_rental_date)
                            : '—'}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

const Stat = ({ label, value, color = '' }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <p className="text-gray-600 text-sm">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
)

export default TopCustomers
