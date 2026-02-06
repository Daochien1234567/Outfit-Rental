// pages/admin/rentals/RentalDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatDate, formatDateTime } from '../../../utils/formatDate'
import { formatMoney } from '../../../utils/formatMoney'
import Button from '../../../components/ui/Button'
import adminService from '../../../services/admin.service'
import paymentService from '../../../services/payment.service'

const RentalDetail = () => {
  const { id } = useParams()

  const [rental, setRental] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (id) fetchDetail()
  }, [id])

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const res = await adminService.getRentalDetail(id)
      const data = res.data
      setRental(data?.rental || null)
      setItems(data?.items || [])
    } catch (err) {
      alert('Không thể tải chi tiết đơn thuê')
    } finally {
      setLoading(false)
    }
  }

  // ===== ACTION HANDLERS =====
  const handleConfirmDelivery = async () => {
  if (!window.confirm('Xác nhận đã giao trang phục?')) return

  setUpdating(true)
  try {
    // 1️⃣ Xác nhận giao hàng
    await adminService.confirmDelivery(id)

    // 2️⃣ Tạo payment song song
    await paymentService.createPayment({
      rental_id: rental.id, // 🔥 CHUẨN FK
      payment_method: 'cash',
})


    alert('Đã xác nhận giao hàng & tạo thanh toán')
    fetchDetail()
  } catch (err) {
    console.error(err)
    alert('Lỗi xác nhận giao hàng hoặc tạo thanh toán')
  } finally {
    setUpdating(false)
  }
}


  const handleConfirmOverdue = async () => {
    if (!window.confirm('Xác nhận đơn thuê quá hạn')) return
    setUpdating(true)
    try {
      await adminService.completeReturn(id)
      alert('Đã xác nhận quá hạn')
      fetchDetail()
    } catch (err) {
      alert('Lỗi xác nhận quá hạn')
    } finally {
      setUpdating(false)
    }
  }

  const handleCompleteRental = async () => {
    if (!window.confirm('Xác nhận hoàn thành đơn thuê?')) return
    setUpdating(true)
    try {
      await adminService.completeRental(id)
      alert('Đã hoàn thành đơn thuê')
      fetchDetail()
    } catch (err) {
      alert('Lỗi hoàn tất đơn thuê')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Đang tải...</div>
  }

  if (!rental) {
    return (
      <div className="p-6 text-center">
        <p>Không tìm thấy đơn thuê</p>
        <Link to="/admin/rentals">
          <Button>Quay lại</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <Link to="/admin/rentals" className="text-blue-600">← Quay lại</Link>
          <h1 className="text-2xl font-bold">Đơn thuê #{rental.id}</h1>
          <p className="text-sm text-gray-500">
            Ngày tạo: {formatDateTime(rental.created_at)}
          </p>
        </div>
      </div>

      {/* ===== ACTION BUTTONS (LUÔN HIỆN) ===== */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">Thao tác admin</h2>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="primary"
            onClick={handleConfirmDelivery}
            disabled={updating}
          >
            Xác nhận đã giao
          </Button>

          <Button
            variant="warning"
            onClick={handleConfirmOverdue}
            disabled={updating}
          >
            Xác nhận quá hạn
          </Button>

          <Button
            variant="success"
            onClick={handleCompleteRental}
            disabled={updating}
          >
            Hoàn thành đơn
          </Button>
        </div>
      </div>

      {/* KHÁCH HÀNG */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">Khách hàng</h2>
        <p><b>Họ tên:</b> {rental.full_name}</p>
        <p><b>Email:</b> {rental.email}</p>
        <p><b>SĐT:</b> {rental.phone}</p>
        <p><b>Địa chỉ:</b> {rental.address}</p>
      </div>

      {/* TRANG PHỤC */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">Trang phục</h2>
        {items.map((item, idx) => (
          <div key={idx} className="border rounded p-3 mb-3">
            <p className="font-medium">{item.costume_name}</p>
            <p className="text-sm text-gray-500">
              {formatDate(item.start_date)} → {formatDate(item.due_date)}
            </p>
            <p>{formatMoney(item.rental_fee)}</p>
          </div>
        ))}
      </div>

      {/* THANH TOÁN */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">Thanh toán</h2>
        <p>Tổng thuê: {formatMoney(rental.total_rental_fee)}</p>
        <p>Tiền cọc: {formatMoney(rental.total_deposit)}</p>
        <p className="font-bold text-blue-600">
          Tổng thanh toán: {formatMoney(rental.total_amount_paid)}
        </p>
        <p className="text-sm text-gray-500">
          Trạng thái thanh toán: {rental.payment_status}
        </p>
      </div>
    </div>
  )
}

export default RentalDetail
