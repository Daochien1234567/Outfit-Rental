import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { formatDate, formatDateTime } from '../../utils/formatDate'
import { formatMoney } from '../../utils/formatMoney'
import Button from '../../components/ui/Button'
import rentalService from '../../services/rental.service'

const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await rentalService.getRentalById(id)
      setOrder(res.data.rental)
      setItems(res.data.items || [])
    } catch (error) {
      console.error('Lỗi lấy chi tiết đơn:', error)
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
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      renting: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-700',
      returned: 'bg-gray-100 text-gray-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

 
  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc muốn huỷ đơn này không?')) return
    try {
      setUpdating(true)
      await rentalService.cancelRental(order.id)
      await fetchOrder()
    } catch (err) {
      console.error('Huỷ đơn thất bại', err)
      alert('Không thể huỷ đơn')
    } finally {
      setUpdating(false)
    }
  }

  const handleExtend = async () => {
    const days = prompt('Nhập số ngày muốn gia hạn:')
    if (!days || isNaN(days) || Number(days) <= 0) return

    try {
      setUpdating(true)
      await rentalService.updateRental(order.id, {
        extend_days: Number(days)
      })
      await fetchOrder()
    } catch (err) {
      console.error('Gia hạn thất bại', err)
      alert('Không thể gia hạn')
    } finally {
      setUpdating(false)
    }
  }

  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Không tìm thấy đơn thuê</p>
        <Link to="/orders" className="text-blue-600 hover:underline mt-4 inline-block">
          Quay lại danh sách
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Đơn thuê #{order.id}</h1>
          <p className="text-gray-600">
            Tạo lúc {formatDateTime(order.created_at)}
          </p>
        </div>

        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(order.rental_status)}`}>
          {getStatusText(order.rental_status)}
        </span>
      </div>

     
      <div className="flex gap-3 mb-6">
        {(order.rental_status === 'pending' || order.rental_status === 'confirmed') && (
          <Button
            variant="danger"
            disabled={updating}
            onClick={handleCancel}
          >
            Huỷ đơn
          </Button>
        )}

        {(order.rental_status === 'renting' || order.rental_status === 'overdue') && (
          <Button
            variant="primary"
            disabled={updating}
            onClick={handleExtend}
          >
            Gia hạn
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ITEMS */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Trang phục thuê</h2>

            <div className="space-y-4">
              {items.map(item => {
                let imageSrc = '/images/costume-placeholder.jpg'

                // nếu images là chuỗi JSON
                if (item.images) {
                  try {
                    const imgs = JSON.parse(item.images)
                    if (Array.isArray(imgs) && imgs.length > 0) {
                      imageSrc = imgs[0]
                    }
                  } catch {
                    imageSrc = item.images
                  }
                }

                return (
                  <div key={item.id} className="flex border-b pb-4 last:border-b-0">
                    <div className="w-24 h-24 flex-shrink-0">
                      <img
                        src={imageSrc}
                        alt={item.costume_name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>

                    <div className="ml-6 flex-grow">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold">{item.costume_name}</h3>
                          <p className="text-sm text-gray-600">
                            {item.quantity} × {formatMoney(item.daily_price)} / ngày
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold">
                            {formatMoney(item.rental_fee)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-600">
                        Tiền cọc: {formatMoney(item.item_deposit)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* THÔNG TIN THUÊ */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Thông tin thuê</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Ngày thuê</p>
                <p className="font-medium">{formatDate(order.start_date)}</p>
              </div>

              <div>
                <p className="text-gray-600">Ngày trả dự kiến</p>
                <p className="font-medium">{formatDate(order.due_date)}</p>
              </div>

              {order.return_date && (
                <div>
                  <p className="text-gray-600">Ngày trả thực tế</p>
                  <p className="font-medium">{formatDate(order.return_date)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TỔNG KẾT */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-4">Tổng thanh toán</h2>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span>Tiền thuê</span>
                <span>{formatMoney(order.total_rental_fee)}</span>
              </div>

              <div className="flex justify-between">
                <span>Tiền phạt</span>
                <span>{formatMoney(order.total_fine)}</span>
              </div>

              <div className="flex justify-between">
                <span>Tiền cọc</span>
                <span>{formatMoney(order.total_deposit)}</span>
              </div>

              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Tổng đã thanh toán</span>
                <span>{formatMoney(order.total_amount_paid)}</span>
              </div>
            </div>

            <div className="text-sm">
              <p>
                Trạng thái thanh toán:{' '}
                <span className="font-medium">
                  {order.payment_status === 'paid'
                    ? 'Đã thanh toán'
                    : 'Chưa thanh toán'}
                </span>
              </p>

              <p className="mt-1">
                Phương thức:{' '}
                <span className="font-medium uppercase">
                  {order.payment_method}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
