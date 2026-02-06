import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDate, formatDateTime } from '../../../utils/formatDate'
import { formatMoney } from '../../../utils/formatMoney'
import Pagination from '../../../components/ui/Pagination'
import adminService from '../../../services/admin.service'

const ManageRentals = () => {
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchRentals()
  }, [currentPage])

  const fetchRentals = async () => {
    setLoading(true)
    try {
      const res = await adminService.getAllRentals({
        page: currentPage,
        limit: 10
      })

      setRentals(res.data.rentals || [])
      setTotalPages(res.data.pagination?.pages || 1)
    } catch (error) {
      console.error('Lỗi khi tải đơn thuê:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      switch (status) {
        case 'completed':
          await adminService.completeRental(id)
          break
        default:
          return
      }
      fetchRentals()
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error)
    }
  }

  /* ===== STATUS MAP ===== */
  const getStatusBadge = (status) =>
  ({
    pending: 'bg-yellow-100 text-yellow-800',     // Chờ xác nhận
    confirmed: 'bg-blue-100 text-blue-800',       // Đã xác nhận
    renting: 'bg-green-100 text-green-800',       // Đang thuê
    overdue: 'bg-red-100 text-red-800',           // Quá hạn
    returned: 'bg-purple-100 text-purple-800',    // Đã trả
    completed: 'bg-gray-200 text-gray-800',       // Hoàn thành
    cancelled: 'bg-red-200 text-red-800'          // Đã huỷ
  }[status] || 'bg-gray-100 text-gray-800')
  
  const getStatusText = (status) =>
  ({
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    renting: 'Đang thuê',
    overdue: 'Quá hạn',
    returned: 'Đã trả',
    completed: 'Hoàn thành',
    cancelled: 'Đã huỷ'
  }[status] || status)

  const StatusDropdown = ({ rental }) => {
    const [open, setOpen] = useState(false)

    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
            rental.rental_status
          )}`}
        >
          {getStatusText(rental.rental_status)} ↓
        </button>

        {open && (
          <div className="absolute z-10 mt-1 bg-white border rounded-lg shadow min-w-[120px]">
            <button
              onClick={() => {
                handleUpdateStatus(rental.id, 'completed')
                setOpen(false)
              }}
              className="block w-full px-4 py-2 text-sm hover:bg-gray-100 text-left"
            >
              Hoàn tất
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn thuê</h1>
        <p className="text-gray-600 mt-1">Xem và quản lý tất cả đơn thuê</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
          <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Mã đơn', 'Khách hàng', 'Thời gian', 'Số tiền', 'Trạng thái', 'Thao tác'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {rentals.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        Không có đơn thuê nào
                      </td>
                    </tr>
                  ) : (
                    rentals.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">#{r.id}</div>
                          <div className="text-xs text-gray-500">
                            {formatDateTime(r.created_at)}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{r.full_name}</div>
                          <div className="text-sm text-gray-500">{r.email}</div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            Nhận: {formatDate(r.start_date)}
                          </div>
                          <div className="text-sm text-gray-900">
                            Trả: {formatDate(r.due_date)}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {formatMoney(Number(r.total_amount_paid))}
                          </div>
                          <div className="text-sm text-gray-500">
                            Cọc: {formatMoney(Number(r.total_deposit))}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(r.rental_status)}`}>
                            {getStatusText(r.rental_status)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <Link
                              to={`/admin/rentals/${r.id}`}
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium rounded-md transition-colors border border-blue-200"
                            >
                              Xem chi tiết
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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

export default ManageRentals