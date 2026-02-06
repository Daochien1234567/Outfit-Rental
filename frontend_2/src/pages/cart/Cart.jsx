import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { formatMoney } from '../../utils/formatMoney'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'

const Cart = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity
  } = useCart()

  const { user } = useAuth()
  const navigate = useNavigate()

  if (cart.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Giỏ hàng trống</h2>
        <p className="text-gray-600 mb-6">Hãy thêm trang phục để bắt đầu!</p>
        <Link to="/costumes">
          <Button variant="primary">Xem trang phục</Button>
        </Link>
      </div>
    )
  }

  // ===== TÍNH TIỀN (CHỈ HIỂN THỊ) =====
  const totalRentalFee = cart.reduce(
    (sum, item) => sum + item.daily_price * item.quantity,
    0
  )

  const totalDeposit = cart.reduce(
    (sum, item) => sum + item.deposit_amount * item.quantity,
    0
  )

  const totalAmount = totalRentalFee + totalDeposit

  const handleGoToCheckout = () => {
    if (!user) {
      navigate('/login')
      return
    }
    navigate('/checkout')
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Giỏ hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ===== CART LIST ===== */}
        <div className="lg:col-span-2 bg-white rounded shadow">
          {cart.map(item => (
            <div key={item.id} className="flex p-6 border-b">
              <img
                src={item.image || '/placeholder-costume.jpg'}
                alt={item.name}
                className="w-24 h-24 object-cover rounded"
              />

              <div className="ml-6 flex-1">
                <div className="flex justify-between">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500"
                  >
                    Xóa
                  </button>
                </div>

                <div className="flex justify-between items-center mt-4">
                  {/* SỐ LƯỢNG */}
                  <div>
                    <label className="mr-2">Số lượng:</label>
                    <select
                      value={item.quantity}
                      onChange={e =>
                        updateQuantity(item.id, Number(e.target.value))
                      }
                      className="border px-2 py-1 rounded"
                    >
                      {[1, 2, 3, 4, 5].map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>

                  {/* GIÁ */}
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatMoney(item.daily_price * item.quantity)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatMoney(item.daily_price)}/ngày
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ===== SUMMARY ===== */}
        <div className="bg-white rounded shadow p-6 sticky top-6">
          <h2 className="text-xl font-bold mb-4">Tóm tắt</h2>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Tiền thuê (1 ngày)</span>
              <span>{formatMoney(totalRentalFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tiền cọc</span>
              <span>{formatMoney(totalDeposit)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Tổng tạm tính</span>
              <span>{formatMoney(totalAmount)}</span>
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            className="mt-6"
            onClick={handleGoToCheckout}
          >
            Tiếp tục
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Cart
