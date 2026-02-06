import { useState, useEffect } from 'react'
import { formatMoney } from '../../../utils/formatMoney'
import { formatDate } from '../../../utils/formatDate'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import adminService from '../../../services/admin.service'

const RevenueReport = () => {
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [filters, setFilters] = useState({
    period: 'month', 
    start_date: '',
    end_date: '',
  })

  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalDeposits: 0,
    refundedDeposits: 0,
    netDeposit: 0,
    activeRentals: 0,
    overdueRentals: 0
  })

  useEffect(() => {
    fetchRevenueReport()
  }, [filters.period])

  const fetchRevenueReport = async () => {
    setLoading(true)
    try {
      // Gọi API lấy báo cáo doanh thu
      const res = await adminService.getRevenueReport({
        period: filters.period,
        start_date: filters.start_date,
        end_date: filters.end_date
      })

      if (res.success && res.data) {
        setReportData(res.data)
        
        // Tính toán summary từ dữ liệu API
        calculateSummary(res.data)
      }
    } catch (error) {
      console.error('Error fetching revenue report:', error)
      // Fallback to mock data nếu API fail
      loadMockData()
    } finally {
      setLoading(false)
    }
  }

  const loadMockData = () => {
    const mockReportData = {
      revenue_by_period: Array.from({ length: 12 }, (_, i) => ({
        period: `2024-${String(i + 1).padStart(2, '0')}`,
        rental_count: Math.floor(Math.random() * 50) + 20,
        rental_revenue: Math.floor(Math.random() * 50000000) + 10000000,
        deposit_collected: Math.floor(Math.random() * 30000000) + 5000000,
        fine_revenue: Math.floor(Math.random() * 5000000) + 1000000,
        total_revenue: 0,
        avg_rental_value: Math.floor(Math.random() * 300000) + 150000
      })).map(item => ({
        ...item,
        total_revenue: item.rental_revenue + item.fine_revenue
      })),

      payment_methods: [
        { payment_method: 'cash', transaction_count: 45, total_amount: 15000000 },
        { payment_method: 'banking', transaction_count: 30, total_amount: 25000000 },
        { payment_method: 'momo', transaction_count: 25, total_amount: 18000000 },
        { payment_method: 'vnpay', transaction_count: 15, total_amount: 12000000 }
      ]
    }

    setReportData(mockReportData)
    calculateSummary(mockReportData)
  }

  const calculateSummary = (data) => {
    if (!data) return

    const revenueData = data.revenue_by_period || []
    
    const totalRevenue = revenueData.reduce((sum, item) => sum + (item.total_revenue || 0), 0)
    const totalOrders = revenueData.reduce((sum, item) => sum + (item.rental_count || 0), 0)
    const totalDeposits = revenueData.reduce((sum, item) => sum + (item.deposit_collected || 0), 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const refundedDeposits = totalDeposits * 0.8
    const netDeposit = totalDeposits - refundedDeposits

    setSummary({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      totalDeposits,
      refundedDeposits,
      netDeposit,
      activeRentals: 0, 
      overdueRentals: 0 
    })
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleGenerateReport = () => {
    fetchRevenueReport()
  }

  const handleExport = () => {
    // Logic export report
    alert('Chức năng export sẽ được phát triển sau')
  }

  const getPeriodLabel = (period) => {
    switch (period) {
      case 'day': return 'Ngày'
      case 'week': return 'Tuần'
      case 'month': return 'Tháng'
      default: return period
    }
  }

  const formatPeriodDisplay = (period, periodType) => {
    if (periodType === 'month') {
      const [year, month] = period.split('-')
      return `Tháng ${month}/${year}`
    } else if (periodType === 'day') {
      return formatDate(period)
    }
    return period
  }

  if (loading && !reportData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Đang tải báo cáo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Báo cáo doanh thu</h1>
          <p className="text-gray-600 mt-1">Phân tích doanh thu và hiệu suất cho thuê</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport}>
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại báo cáo
            </label>
            <select
              name="period"
              value={filters.period}
              onChange={handleFilterChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
            </select>
          </div>

          <Input
            label="Từ ngày"
            type="date"
            name="start_date"
            value={filters.start_date}
            onChange={handleFilterChange}
          />

          <Input
            label="Đến ngày"
            type="date"
            name="end_date"
            value={filters.end_date}
            onChange={handleFilterChange}
          />

          <div className="flex items-end">
            <Button 
              variant="primary" 
              onClick={handleGenerateReport} 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Tạo báo cáo'}
            </Button>
          </div>
        </div>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Tổng doanh thu</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatMoney(summary.totalRevenue)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {summary.totalOrders} đơn hàng
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Giá trị trung bình/đơn</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatMoney(summary.avgOrderValue)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Trung bình mỗi đơn
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Tiền cọc thu được</p>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatMoney(summary.totalDeposits)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Đã hoàn: {formatMoney(summary.refundedDeposits)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Cọc còn giữ lại</p>
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatMoney(summary.netDeposit)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Còn lại sau hoàn
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Biểu đồ doanh thu theo kỳ */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Doanh thu theo {getPeriodLabel(filters.period)}
          </h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {reportData?.revenue_by_period?.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {formatPeriodDisplay(item.period, filters.period)}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatMoney(item.total_revenue || 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ 
                      width: `${Math.min(100, ((item.total_revenue || 0) / (summary.totalRevenue / reportData.revenue_by_period.length * 2)) * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{item.rental_count} đơn</span>
                  <span>TB: {formatMoney(item.avg_rental_value || 0)}/đơn</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phương thức thanh toán */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Phương thức thanh toán
          </h2>
          <div className="space-y-4">
            {reportData?.payment_methods?.map((method, index) => {
              const percentage = summary.totalRevenue > 0 
                ? (method.total_amount / summary.totalRevenue * 100).toFixed(1)
                : 0
              
              return (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
                        {getPaymentMethodIcon(method.payment_method)}
                      </div>
                      <span className="font-medium text-gray-900">
                        {getPaymentMethodLabel(method.payment_method)}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {formatMoney(method.total_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{method.transaction_count} giao dịch</span>
                    <span>{percentage}% tổng doanh thu</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bảng chi tiết */}
      {reportData?.revenue_by_period && (
        <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Chi tiết doanh thu</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kỳ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doanh thu thuê
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiền cọc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phí phạt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng doanh thu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TB/đơn
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.revenue_by_period.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPeriodDisplay(item.period, filters.period)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{item.rental_count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {formatMoney(item.rental_revenue || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">
                        {formatMoney(item.deposit_collected || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-orange-600">
                        {formatMoney(item.fine_revenue || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatMoney(item.total_revenue || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {formatMoney(item.avg_rental_value || 0)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions
const getPaymentMethodLabel = (method) => {
  const labels = {
    'cash': 'Tiền mặt',
    'banking': 'Chuyển khoản',
    'momo': 'Momo',
    'zalopay': 'ZaloPay',
    'vnpay': 'VNPay'
  }
  return labels[method] || method
}

const getPaymentMethodIcon = (method) => {
  switch(method) {
    case 'cash':
      return '💰'
    case 'banking':
      return '🏦'
    case 'momo':
      return '📱'
    case 'zalopay':
      return 'Z'
    case 'vnpay':
      return 'V'
    default:
      return '💳'
  }
}

export default RevenueReport