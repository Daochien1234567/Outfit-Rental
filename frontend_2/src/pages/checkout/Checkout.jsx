import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import rentalService from '../../services/rental.service'
import { formatMoney } from '../../utils/formatMoney'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const Checkout = () => {
  const { user } = useAuth()
  const { cart, clearCart } = useCart()
  const navigate = useNavigate()

  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    start_date: '',
    rental_days: 1,
    payment_method: 'cash'
  })

  if (cart.length === 0) {
    navigate('/cart')
    return null
  }

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  // ===== TÍNH TIỀN (HIỂN THỊ) =====
  const totalRentalFee = cart.reduce(
    (sum, item) =>
      sum + item.daily_price * item.quantity * form.rental_days,
    0
  )

  const totalDeposit = cart.reduce(
    (sum, item) =>
      sum + item.deposit_amount * item.quantity,
    0
  )

  const totalAmount = totalRentalFee + totalDeposit

  const handleSubmit = async (e) => {
  e.preventDefault()

  if (!form.start_date) {
    alert('Vui lòng chọn ngày thuê')
    return
  }

  if (Number(form.rental_days) <= 0) {
    alert('Số ngày thuê phải lớn hơn 0')
    return
  }

  setSubmitting(true)
  try {
    await rentalService.createRental({
      items: cart.map(item => ({
        costume_id: item.id,
        quantity: item.quantity
      })),
      rental_days: Number(form.rental_days),
      start_date: form.start_date,
      payment_method: form.payment_method
    })

    clearCart()
    navigate('/payment-result', {
      state: {
        success: true,
        amount: totalAmount
      }
    })
  } catch (err) {
    alert(err.response?.data?.message || 'Tạo đơn thuê thất bại')
  } finally {
    setSubmitting(false)
  }
}


  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Thanh toán</h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* USER */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="font-bold mb-4">Thông tin khách hàng</h2>
            <Input label="Họ tên" value={user.full_name} disabled />
            <Input label="Email" value={user.email} disabled />
          </div>

          {/* RENTAL */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="font-bold mb-4">Thông tin thuê</h2>

            <Input
              type="date"
              name="start_date"
              label="Ngày thuê"
              value={form.start_date}
              onChange={handleChange}
              required
            />

            <Input
              type="number"
              name="rental_days"
              label="Số ngày thuê"
              min="1"
              value={form.rental_days}
              onChange={handleChange}
              required
            />
          </div>

          {/* PAYMENT */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="font-bold mb-4">Thanh toán</h2>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="payment_method"
                value="cash"
                checked={form.payment_method === 'cash'}
                onChange={handleChange}
              />
              Thanh toán khi nhận
            </label>
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-white p-6 rounded shadow sticky top-6">
          <h2 className="font-bold mb-4">Tóm tắt đơn</h2>

          <p>Tiền thuê: {formatMoney(totalRentalFee)}</p>
          <p>Tiền cọc: {formatMoney(totalDeposit)}</p>

          <hr className="my-3" />

          <p className="font-bold">
            Tổng: {formatMoney(totalAmount)}
          </p>

          <Button
            type='submit'
            fullWidth
            className="mt-6"
            disabled={submitting}
          >
            {submitting ? 'Đang xử lý...' : 'Xác nhận thuê'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default Checkout
