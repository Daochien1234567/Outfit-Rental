import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const UpdateProfile = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Mock update
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update user in context and localStorage
      updateUser(formData)
      
      setSuccess('Profile updated successfully!')
      setTimeout(() => {
        navigate('/profile')
      }, 2000)
    } catch (err) {
      setError('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Update Profile</h1>
          <p className="text-gray-600">Update your personal information</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
          />
          
          <Input
            label="Email"
            type="email"
            value={user?.email || ''}
            disabled
            className="bg-gray-50"
          />
          
          <Input
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter your phone number"
          />
          
          <Input
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter your address"
          />
          
          <div className="flex space-x-4 mt-6">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/profile')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UpdateProfile