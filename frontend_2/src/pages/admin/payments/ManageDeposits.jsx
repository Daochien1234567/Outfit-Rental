import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDate, formatDateTime } from '../../../utils/formatDate'
import { formatMoney } from '../../../utils/formatMoney'
import Button from '../../../components/ui/Button'
import Pagination from '../../../components/ui/Pagination'
import adminService from '../../../services/admin.service'

const ManageDeposits = () => {
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState({
    totalDeposits: 0,
    pendingRefunds: 0,
    refunded: 0,
    forfeited: 0
  })
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    fetchDeposits()
  }, [currentPage])

  const fetchDeposits = async () => {
    setLoading(true)
    try {
      const res = await adminService.getDepositHistory({
        page: currentPage,
        limit: 10
      })
      
      if (res.data) {
        setDeposits(res.data.deposits || [])
        setTotalPages(res.data.pagination?.pages || 1)
        calculateSummary(res.data.deposits || [])
      }
    } catch (error) {
      console.error('Error fetching deposits:', error)
      // Fallback to mock data
      loadMockData()
    } finally {
      setLoading(false)
    }
  }

  const loadMockData = () => {
    const mockDeposits = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      rental_id: `R${String(i + 1).padStart(6, '0')}`,
      user_id: i + 100,
      full_name: `Nguyễn Văn ${String.fromCharCode(65 + i)}`,
      email: `customer${i + 1}@example.com`,
      rental_status: ['renting', 'completed', 'returned', 'cancelled'][Math.floor(Math.random() * 4)],
      total_deposit: Math.floor(Math.random() * 3000000) + 500000,
      deposit_status: ['pending', 'paid', 'refunded', 'forfeited'][Math.floor(Math.random() * 4)],
      created_at: '2024-01-19T10:30:00Z',
      payment_date: '2024-01-19T11:15:00Z',
      refund_date: i < 3 ? '2024-01-22T14:30:00Z' : null,
      refund_amount: i < 3 ? Math.floor(Math.random() * 3000000) + 500000 : null,
      refund_method: i < 3 ? ['banking', 'cash', 'momo'][Math.floor(Math.random() * 3)] : null,
      penalty_fee: Math.floor(Math.random() * 500000) + 100000,
      return_condition: ['good', 'minor_damage', 'major_damage', null][Math.floor(Math.random() * 4)]
    }))
    
    setDeposits(mockDeposits)
    setTotalPages(3)
    calculateSummary(mockDeposits)
  }

  const calculateSummary = (depositList) => {
    const totalDeposits = depositList.reduce((sum, d) => sum + (d.total_deposit || 0), 0)
    const pendingRefunds = depositList.filter(d => 
      d.deposit_status === 'paid' && 
      ['completed', 'returned'].includes(d.rental_status)
    ).length
    const refunded = depositList.filter(d => d.deposit_status === 'refunded').length
    const forfeited = depositList.filter(d => d.deposit_status === 'forfeited').length

    setSummary({
      totalDeposits,
      pendingRefunds,
      refunded,
      forfeited
    })
  }

  const handleProcessRefund = async (deposit) => {
    if (!window.confirm(`Xác nhận hoàn cọc cho đơn ${deposit.rental_id}?\nSố tiền: ${formatMoney(deposit.total_deposit)}`)) {
      return
    }

    setProcessingId(deposit.id)
    try {
      const refundData = {
        rental_id: deposit.rental_id,
        refund_amount: deposit.total_deposit - (deposit.penalty_fee || 0),
        refund_method: 'banking', // Mặc định chuyển khoản
        notes: 'Hoàn cọc theo chính sách'
      }

      const res = await adminService.processDepositRefund(refundData)
      if (res.success) {
        alert('Hoàn cọc thành công!')
        fetchDeposits() // Refresh data
      } else {
        throw new Error(res.message || 'Hoàn cọc thất bại')
      }
    } catch (error) {
      console.error('Error processing refund:', error)
      alert(error.message || 'Có lỗi xảy ra khi hoàn cọc')
    } finally {
      setProcessingId(null)
    }
  }

  const handleForfeitDeposit = async (deposit) => {
    if (!window.confirm(`Xác nhận tịch thu cọc cho đơn ${deposit.rental_id}?\nSố tiền: ${formatMoney(deposit.total_deposit)}\n\nLý do: Trang phục bị hư hỏng nặng/mất.`)) {
      return
    }

    setProcessingId(deposit.id)
    try {
      alert('Chức năng tịch thu cọc ')
      // Cập nhật local state
      setDeposits(deposits.map(d => 
        d.id === deposit.id ? { ...d, deposit_status: 'forfeited' } : d
      ))
    } catch (error) {
      console.error('Error forfeiting deposit:', error)
      alert('Có lỗi xảy ra')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      paid: 'bg-green-100 text-green-800 border border-green-200',
      refunded: 'bg-blue-100 text-blue-800 border border-blue-200',
      forfeited: 'bg-red-100 text-red-800 border border-red-200'
    }
    return styles[status] || 'bg-gray-100 text-gray-800 border border-gray-200'
  }

  const getRentalStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
      renting: 'bg-green-100 text-green-800 border border-green-200',
      overdue: 'bg-red-100 text-red-800 border border-red-200',
      returned: 'bg-purple-100 text-purple-800 border border-purple-200',
      completed: 'bg-gray-100 text-gray-800 border border-gray-200',
      cancelled: 'bg-red-200 text-red-800 border border-red-300'
    }
    return styles[status] || 'bg-gray-100 text-gray-800 border border-gray-200'
  }

  const getReturnConditionBadge = (condition) => {
    const styles = {
      good: 'bg-green-100 text-green-800 border border-green-200',
      minor_damage: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      major_damage: 'bg-red-100 text-red-800 border border-red-200',
      lost: 'bg-red-200 text-red-800 border border-red-300'
    }
    return styles[condition] || 'bg-gray-100 text-gray-800 border border-gray-200'
  }

  const getStatusText = (status) => {
    const texts = {
      pending: 'Chờ xử lý',
      paid: 'Đã thanh toán',
      refunded: 'Đã hoàn cọc',
      forfeited: 'Bị tịch thu'
    }
    return texts[status] || status
  }

  const getRentalStatusText = (status) => {
    const texts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      renting: 'Đang thuê',
      overdue: 'Quá hạn',
      returned: 'Đã trả',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    }
    return texts[status] || status
  }

  const getReturnConditionText = (condition) => {
    const texts = {
      good: 'Tốt',
      minor_damage: 'Hư hỏng nhẹ',
      major_damage: 'Hư hỏng nặng',
      lost: 'Bị mất'
    }
    return texts[condition] || condition || 'Chưa trả'
  }

  const canProcessRefund = (deposit) => {
    return deposit.deposit_status === 'paid' && 
           ['completed', 'returned'].includes(deposit.rental_status) &&
           !processingId
  }

  const canForfeitDeposit = (deposit) => {
    return deposit.deposit_status === 'paid' && 
           deposit.return_condition === 'major_damage' &&
           !processingId
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý tiền cọc</h1>
        <p className="text-gray-600 mt-1">Theo dõi và xử lý tiền cọc đơn thuê</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Tổng tiền cọc</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatMoney(summary.totalDeposits)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Chờ hoàn cọc</p>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {summary.pendingRefunds}
          </p>
          <p className="text-sm text-gray-500 mt-1">đơn cần xử lý</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Đã hoàn cọc</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {summary.refunded}
          </p>
          <p className="text-sm text-gray-500 mt-1">đơn đã hoàn</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Bị tịch thu</p>
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {summary.forfeited}
          </p>
          <p className="text-sm text-gray-500 mt-1">đơn bị tịch thu</p>
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Danh sách tiền cọc</h2>
          <p className="text-sm text-gray-600 mt-1">
            Tổng cộng: {deposits.length} bản ghi
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : deposits.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Chưa có dữ liệu tiền cọc
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiền cọc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái cọc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tình trạng trả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deposits.map(deposit => (
                  <tr key={deposit.id || deposit.rental_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{deposit.rental_id}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(deposit.created_at || deposit.payment_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{deposit.full_name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {deposit.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">
                        {formatMoney(deposit.total_deposit)}
                      </div>
                      {deposit.penalty_fee > 0 && (
                        <div className="text-sm text-red-600">
                          Phí phạt: {formatMoney(deposit.penalty_fee)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(deposit.deposit_status)}`}>
                        {getStatusText(deposit.deposit_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRentalStatusBadge(deposit.rental_status)}`}>
                        {getRentalStatusText(deposit.rental_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {deposit.return_condition ? (
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getReturnConditionBadge(deposit.return_condition)}`}>
                          {getReturnConditionText(deposit.return_condition)}
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                          Chưa trả
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {canProcessRefund(deposit) && (
                          <Button
                            onClick={() => handleProcessRefund(deposit)}
                            variant="primary"
                            size="sm"
                            disabled={processingId === deposit.id}
                          >
                            {processingId === deposit.id ? (
                              <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang xử lý
                              </span>
                            ) : (
                              'Hoàn cọc'
                            )}
                          </Button>
                        )}

                        {canForfeitDeposit(deposit) && (
                          <Button
                            onClick={() => handleForfeitDeposit(deposit)}
                            variant="danger"
                            size="sm"
                            disabled={processingId === deposit.id}
                          >
                            Tịch thu cọc
                          </Button>
                        )}

                        <Link to={`/admin/deposits/refund/${deposit.rental_id}`}>
                          <Button variant="outline" size="sm">
                            Chi tiết
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

export default ManageDeposits