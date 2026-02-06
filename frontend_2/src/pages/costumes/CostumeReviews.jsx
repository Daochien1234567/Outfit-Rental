import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import costumeService from '../../services/costume.service'

const CostumeReviews = () => {
  const { id } = useParams()

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  })

  useEffect(() => {
    fetchReviews()
  }, [id])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await costumeService.getReviews(id)
      setReviews(res.data)
    } catch (err) {
      console.error('Fetch reviews failed', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!newReview.comment.trim()) return

    try {
      const res = await costumeService.createReview(id, {
        rating: newReview.rating,
        comment: newReview.comment
      })

      setReviews(prev => [res.data, ...prev])
      setNewReview({ rating: 5, comment: '' })
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể gửi đánh giá')
    }
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Đánh giá sản phẩm</h2>

      {/* ADD REVIEW */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h3 className="font-semibold mb-4">Viết đánh giá</h3>

        <form onSubmit={handleSubmitReview}>
          {/* RATING */}
          <div className="mb-4">
            <label className="block mb-2">Số sao</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className="text-2xl"
                  onClick={() =>
                    setNewReview(prev => ({ ...prev, rating: star }))
                  }
                >
                  {star <= newReview.rating ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>

          {/* COMMENT */}
          <Input
            label="Nhận xét"
            as="textarea"
            rows={4}
            value={newReview.comment}
            onChange={(e) =>
              setNewReview(prev => ({
                ...prev,
                comment: e.target.value
              }))
            }
            placeholder="Chia sẻ trải nghiệm của bạn..."
          />

          <Button type="submit" className="mt-4">
            Gửi đánh giá
          </Button>
        </form>
      </div>

      {/* LIST */}
      {loading ? (
        <p>Đang tải đánh giá...</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500">Chưa có đánh giá</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div
              key={review.id}
              className="bg-white p-4 rounded border"
            >
              <div className="flex justify-between mb-2">
                <div>
                  <p className="font-semibold">
                    {review.user?.full_name || 'Ẩn danh'}
                  </p>
                  <div className="text-yellow-400">
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(review.createdAt)}
                </span>
              </div>

              <p>{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CostumeReviews
