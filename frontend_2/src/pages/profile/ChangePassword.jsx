import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const ChangePassword = () => {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      })
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setLoading(true)
    setErrors({})
    setSuccess('')

    try {
      // Mock password change
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('Password changed successfully!')
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      setTimeout(() => {
        navigate('/profile')
      }, 2000)
    } catch (err) {
      setErrors({ general: 'Failed to change password. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Change Password</h1>
          <p className="text-gray-600">Update your account password</p>
        </div>
        
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {errors.general}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <Input
            label="Current Password"
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            error={errors.currentPassword}
            required
          />
          
          <Input
            label="New Password"
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            error={errors.newPassword}
            required
          />
          
          <Input
            label="Confirm New Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
          />
          
          <div className="mt-2 text-sm text-gray-600">
            <p>Password must be at least 6 characters long</p>
          </div>
          
          <div className="flex space-x-4 mt-6">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              fullWidth
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/profile')}
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePassword