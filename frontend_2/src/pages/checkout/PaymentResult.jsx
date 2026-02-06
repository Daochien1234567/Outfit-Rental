import { useLocation, useNavigate, Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { formatMoney } from '../../utils/formatMoney'

const PaymentResult = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { success, orderId, amount, deposit, error } = location.state || {}

  if (!location.state) {
    navigate('/')
    return null
  }

  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="bg-white rounded-lg shadow-md p-8">
        {success ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold mb-4">Order Confirmed!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for your order. Your rental has been confirmed.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="font-semibold mb-2">Order Details:</p>
              <p className="text-gray-600">Order ID: <span className="font-medium">{orderId}</span></p>
              <p className="text-gray-600">Amount Paid: <span className="font-medium">{formatMoney(amount)}</span></p>
              <p className="text-gray-600">Deposit Required: <span className="font-medium">{formatMoney(deposit)}</span></p>
            </div>
            
            <p className="text-gray-600 mb-8">
              We've sent a confirmation email with all the details. Please bring your ID when picking up the costumes.
            </p>
            
            <div className="space-y-4">
              <Link to="/orders">
                <Button variant="primary" fullWidth>
                  View My Orders
                </Button>
              </Link>
              <Link to="/costumes">
                <Button variant="outline" fullWidth>
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold mb-4">Payment Failed</h1>
            <p className="text-gray-600 mb-6">
              {error || 'Something went wrong with your payment. Please try again.'}
            </p>
            
            <div className="space-y-4">
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/checkout')}
              >
                Try Again
              </Button>
              <Link to="/cart">
                <Button variant="outline" fullWidth>
                  Back to Cart
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default PaymentResult