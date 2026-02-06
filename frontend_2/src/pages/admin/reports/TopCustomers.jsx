import { useEffect, useState } from 'react'
import { formatMoney } from '../../../utils/formatMoney'
import { formatDate } from '../../../utils/formatDate'
import Button from '../../../components/ui/Button'

import  adminService  from '../../../services/admin.service'


const TopCustomers = () => {
  const [timeRange, setTimeRange] = useState('all')
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    avgCustomerValue: 0,
    totalOrders: 0,
    customerCount: 0
  })

  useEffect(() => {
    fetchTopCustomers()
  }, [timeRange])

  const fetchTopCustomers = async () => {
    setLoading(true)
    try {
      const res = await adminService.getTopCustomers({ limit: 10 })
      
      console.log('API Response:', res)

      if (res.success && res.data) {
        // Chuẩn hóa dữ liệu
        const normalizedCustomers = res.data.map(customer => ({
          id: customer.id,
          full_name: customer.full_name || 'Khách hàng',
          email: customer.email || '',
          phone: customer.phone || '',
          total_spent: customer.total_spent || 0,
          completed_rentals: customer.completed_rentals || 0,
          avg_spent_per_rental: customer.avg_spent_per_rental || 0,
          last_rental_date: customer.last_rental_date || null
        }))
        
        setCustomers(normalizedCustomers)
        
        // Tính toán thống kê
        calculateStats(normalizedCustomers)
      } else {
        console.error('API error:', res.message)
        setCustomers([])
      }
    } catch (error) {
      console.error('Error fetching top customers:', error)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (customerList) => {
    if (!customerList || customerList.length === 0) {
      setStats({
        totalRevenue: 0,
        avgCustomerValue: 0,
        totalOrders: 0,
        customerCount: 0
      })
      return
    }

    const totalRevenue = customerList.reduce((sum, c) => sum + Number(c.total_spent || 0), 0)
    const totalOrders = customerList.reduce((sum, c) => sum + Number(c.completed_rentals || 0), 0)
    const avgCustomerValue = customerList.length > 0 ? totalRevenue / customerList.length : 0

    setStats({
      totalRevenue,
      avgCustomerValue,
      totalOrders,
      customerCount: customerList.length
    })
  }

  const getTimeRangeLabel = (range) => {
    const labels = {
      'all': 'Tất cả',
      'week': 'Tuần',
      'month': 'Tháng',
      'quarter': 'Quý',
      'year': 'Năm'
    }
    return labels[range] || range
  }

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
          {/* Thống kê */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-green-600">
                {formatMoney(stats.totalRevenue)}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Giá trị TB/KH</p>
              <p className="text-2xl font-bold">
                {formatMoney(stats.avgCustomerValue)}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Tổng đơn hoàn thành</p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Số khách hàng</p>
              <p className="text-2xl font-bold">{stats.customerCount}</p>
            </div>
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
                  <th className="px-6 py-3 text-left">TB/đơn</th>
                  <th className="px-6 py-3 text-left">Thuê gần nhất</th>
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
                  customers.map((customer, index) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{customer.full_name}</div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-green-600">
                        {formatMoney(customer.total_spent)}
                      </td>
                      <td className="px-6 py-4">{customer.completed_rentals}</td>
                      <td className="px-6 py-4">
                        {formatMoney(customer.avg_spent_per_rental)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {customer.last_rental_date 
                          ? formatDate(customer.last_rental_date)
                          : '—'}
                      </td>
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

export default TopCustomers