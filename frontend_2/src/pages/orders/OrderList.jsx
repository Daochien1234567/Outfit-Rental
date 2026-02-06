import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'
import { formatMoney } from '../../utils/formatMoney'
import Pagination from '../../components/ui/Pagination'
import Button from '../../components/ui/Button'
import rentalService from '../../services/rental.service'

const OrderList = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line
  }, [currentPage])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: 10
      }

      const res = await rentalService.getRentals(params)

      setOrders(res.rentals || [])
      setTotalPages(res.totalPages || 1)
    } catch (err) {
      console.error('Fetch orders error:', err)
    } finally {
      setLoading(false)
    }
  }

  
  const getStatusText = (status) => {
    const map = {
      pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    renting: 'Đang thuê',
    overdue: 'Quá hạn',
    returned: 'Đã trả',
    completed: 'Hoàn thành',
    cancelled: 'Đã huỷ'
    }
    return map[status] || status
  }

  const getStatusBadge = (status) => {
    const map = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    renting: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    returned: 'bg-purple-100 text-purple-700',
    completed: 'bg-gray-200 text-gray-700',
    cancelled: 'bg-gray-100 text-gray-500'
    }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Đơn thuê của tôi</h1>

      {loading ? (
        <p>Đang tải...</p>
      ) : orders.length === 0 ? (
        <p>Chưa có đơn thuê</p>
      ) : (
        <>
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">Mã đơn</th>
                  <th className="px-6 py-3 text-left">Ngày tạo</th>
                  <th className="px-6 py-3 text-left">Trạng thái</th>
                  <th className="px-6 py-3 text-left">Ngày thuê - trả</th>
                  <th className="px-6 py-3 text-left">Tổng tiền</th>
                  <th className="px-6 py-3 text-left">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-t">
                    <td className="px-6 py-4 font-medium">
                      #{order.id}
                    </td>

                    <td className="px-6 py-4">
                      {formatDate(order.created_at)}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.rental_status)}`}>
                        {getStatusText(order.rental_status)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {formatDate(order.start_date)} – {formatDate(order.due_date)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold">
                        {formatMoney(order.total_amount_paid)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Cọc: {formatMoney(order.total_deposit)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  )
}

export default OrderList
