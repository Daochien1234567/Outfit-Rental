import { Link } from 'react-router-dom'
import { formatMoney } from '../utils/formatMoney'
import { useCart } from '../hooks/useCart'

const CostumeCard = ({ costume, showActions = true }) => {
  const { addToCart } = useCart()

  const image =
    Array.isArray(costume.images) && costume.images.length > 0
      ? costume.images[0]
      : costume.image || '/placeholder-costume.jpg'

  const price = Number(costume.daily_price) || 0
  const deposit = Number(costume.deposit_amount) || 0
  const stock =
    costume.available_quantity ??
    costume.quantity ??
    costume.stock_quantity ??
    0

  const handleAddToCart = () => {
    addToCart(costume)
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={costume.name}
          className="w-full h-full object-cover"
        />

        {stock === 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
            Hết hàng
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {costume.name}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {costume.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xl font-bold text-blue-600">
              {formatMoney(price)}/ngày
            </span>
            <p className="text-sm text-gray-500">
              Cọc: {formatMoney(deposit)}
            </p>
          </div>

          <div className="text-right text-sm text-gray-600">
            <div>
              Size: <span className="font-medium">{costume.size}</span>
            </div>
            <div>
              Còn: <span className="font-medium">{stock}</span>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="flex space-x-2">
            <Link
              to={`/costumes/${costume.id}`}
              className="flex-1 bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700"
            >
              Chi tiết
            </Link>

            <button
              onClick={handleAddToCart}
              disabled={stock === 0}
              className={`px-4 py-2 rounded transition ${
                stock === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              Thêm vào giỏ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CostumeCard
