import { useState, useEffect, useCallback } from 'react'
import { formatMoney } from '../../../utils/formatMoney'
import { formatDate } from '../../../utils/formatDate'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import adminService from '../../../services/admin.service'

const RevenueReport = () => {
  const [filters, setFilters] = useState({
    period: 'month',
    start_date: '',
    end_date: ''
  })
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)


  const fetchReportData = useCallback(async () => {
    setLoading(true)
    try {
      const [overviewRes, revenueRes] = await Promise.all([
        adminService.getOverviewReport(),
        adminService.getRevenueReport(filters)
      ])

      const overview = overviewRes?.data?.data || {}
      const revenue = revenueRes?.data?.data || {}

      setReportData({
        summary: {
          totalRevenue: overview?.rentals?.total_revenue || 0,
          totalOrders: overview?.rentals?.total_rentals || 0,
          averageOrderValue: overview?.rentals?.avg_rental_value || 0,
          totalDeposits: revenue?.total_deposits || 0,
          refundedDeposits: revenue?.refunded_deposits || 0,
          netDeposit:
            (revenue?.total_deposits || 0) -
            (revenue?.refunded_deposits || 0),
          activeRentals: overview?.rentals?.active_rentals || 0,
          overdueRentals: overview?.rentals?.overdue_rentals || 0
        },
        revenue_by_period: revenue?.revenue_by_period || [],
        payment_methods: revenue?.payment_methods || [],
        daily_stats: overview?.daily_stats || []
      })
    } catch (err) {
      console.error('Fetch revenue report failed:', err)
      setReportData(null)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

  const handleFilterChange = (e) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleExport = () => {
    console.log('Export report:', reportData)
  }

  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Đang tải báo cáo...</p>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Không thể tải dữ liệu</p>
        <Button className="mt-4" onClick={fetchReportData}>
          Thử lại
        </Button>
      </div>
    )
  }

  
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Báo cáo doanh thu</h1>
          <p className="text-gray-600">
            Phân tích doanh thu và hiệu suất cho thuê
          </p>
        </div>
        <Button onClick={handleExport}>Xuất báo cáo</Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            name="period"
            value={filters.period}
            onChange={handleFilterChange}
            className="border rounded-lg px-3 py-2"
          >
            <option value="day">Theo ngày</option>
            <option value="week">Theo tuần</option>
            <option value="month">Theo tháng</option>
          </select>

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

          <Button onClick={fetchReportData} fullWidth>
            Tạo báo cáo
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          label="Tổng doanh thu"
          value={formatMoney(reportData.summary.totalRevenue)}
          sub={`${reportData.summary.totalOrders} đơn`}
          color="text-green-600"
        />
        <SummaryCard
          label="Đơn đang thuê"
          value={reportData.summary.activeRentals}
          sub={`${reportData.summary.overdueRentals} quá hạn`}
          color="text-blue-600"
        />
        <SummaryCard
          label="Cọc đang giữ"
          value={formatMoney(reportData.summary.netDeposit)}
          sub={`Đã thu ${formatMoney(reportData.summary.totalDeposits)}`}
          color="text-purple-600"
        />
        <SummaryCard
          label="Giá trị TB / đơn"
          value={formatMoney(reportData.summary.averageOrderValue)}
        />
      </div>

      {/* Revenue by period */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">
          Doanh thu theo {filters.period}
        </h2>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {reportData.revenue_by_period.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{item.period}</span>
              <span className="font-semibold text-green-600">
                {formatMoney(item.total_revenue || 0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment methods */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Phương thức thanh toán</h2>

        <div className="space-y-3">
          {reportData.payment_methods.map((m, idx) => (
            <div key={idx} className="flex justify-between">
              <span className="capitalize">{m.payment_method}</span>
              <span className="font-semibold">
                {formatMoney(m.total_amount || 0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Last 7 days */}
      {reportData.daily_stats.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">7 ngày gần nhất</h2>

          <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
            {reportData.daily_stats.map((d, idx) => (
              <div key={idx} className="text-center border rounded p-3">
                <div className="text-sm text-gray-600">
                  {formatDate(d.date)}
                </div>
                <div className="font-bold text-green-600">
                  {formatMoney(d.daily_revenue || 0)}
                </div>
                <div className="text-xs text-gray-500">
                  {d.rentals_count || 0} đơn
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


const SummaryCard = ({ label, value, sub, color = '' }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <p className="text-gray-600 text-sm">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
  </div>
)

export default RevenueReport
