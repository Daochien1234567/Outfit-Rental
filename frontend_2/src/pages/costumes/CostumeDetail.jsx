import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { formatMoney } from '../../utils/formatMoney'
import Button from '../../components/ui/Button'
import costumeService from '../../services/costume.service'

const CostumeDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [costume, setCostume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rentalDays, setRentalDays] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)

  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [showReviews, setShowReviews] = useState(false)

  /* ===== ADD REVIEW ===== */
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

 
  useEffect(() => {
    fetchCostume()
    fetchReviews()
    // eslint-disable-next-line
  }, [id])

  const fetchCostume = async () => {
    setLoading(true)
    try {
      const res = await costumeService.getCostumeById(id)
      setCostume(res.data)
    } catch (err) {
      console.error('Fetch costume error:', err)
      setCostume(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    setReviewsLoading(true)
    try {
      const res = await costumeService.getReviews(id)
      setReviews(res.data || [])
    } catch (err) {
      console.error('Fetch reviews error:', err)
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }

  
  const handleAddToCart = () => {
    if (!costume || costume.available_quantity <= 0) return

    addToCart(costume, rentalDays)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleRentNow = () => {
    addToCart(costume, rentalDays)
    navigate('/cart')
  }

  
  const handleSubmitReview = async () => {
    if (!comment.trim()) return alert('Vui lòng nhập nội dung đánh giá')

    try {
      setReviewSubmitting(true)
      await costumeService.createReview(id, {
        rating,
        comment
      })
      setComment('')
      setRating(5)
      fetchReviews()
      alert('Đánh giá thành công')
    } catch (err) {
      console.error('Create review error:', err)
      alert('Không thể gửi đánh giá')
    } finally {
      setReviewSubmitting(false)
    }
  }

  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!costume) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Không tìm thấy trang phục</p>
      </div>
    )
  }

  return (
    <div>
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          Đã thêm vào giỏ hàng
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* IMAGE */}
        <img
          src={costume.images?.[0] || '/placeholder-costume.jpg'}
          alt={costume.name}
          className="w-full h-96 object-cover rounded-lg"
        />

        {/* INFO */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{costume.name}</h1>

          <p className="text-gray-600 mb-6">{costume.description}</p>

          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {formatMoney(costume.daily_price)} / ngày
            </p>

            <div className="flex gap-4 mt-6">
              <Button onClick={handleRentNow} fullWidth>
                Thuê ngay
              </Button>
              <Button variant="outline" onClick={handleAddToCart} fullWidth>
                Thêm vào giỏ
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold mb-4">Đánh giá</h3>

        {/* CREATE REVIEW */}
        <div className="border p-4 rounded mb-6">
          <div className="flex gap-4 mb-3">
            <select
              value={rating}
              onChange={e => setRating(Number(e.target.value))}
              className="border rounded px-3 py-2"
            >
              {[5, 4, 3, 2, 1].map(r => (
                <option key={r} value={r}>
                  {r} ★
                </option>
              ))}
            </select>

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Viết đánh giá của bạn..."
              className="flex-1 border rounded px-3 py-2"
            />
          </div>

          <Button
            onClick={handleSubmitReview}
            disabled={reviewSubmitting}
          >
            Gửi đánh giá
          </Button>
        </div>

        {/* LIST REVIEWS */}
        {reviewsLoading ? (
          <p>Đang tải...</p>
        ) : reviews.length > 0 ? (
          reviews.map(r => (
            <div key={r.id} className="border p-4 rounded mb-3">
              <div className="flex justify-between mb-1">
                <p className="font-semibold">
                  {r.user?.full_name || 'Ẩn danh'}
                </p>
                <span>{r.rating} ★</span>
              </div>
              <p>{r.comment}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Chưa có đánh giá</p>
        )}
      </div>
    </div>
  )
}

export default CostumeDetail
