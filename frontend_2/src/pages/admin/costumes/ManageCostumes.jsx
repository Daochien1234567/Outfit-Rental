import { useState, useEffect } from 'react'
import { formatMoney } from '../../../utils/formatMoney'
import Button from '../../../components/ui/Button'
import Pagination from '../../../components/ui/Pagination'
import Input from '../../../components/ui/Input'
import adminService from '../../../services/admin.service'

const initialFormData = {
  name: '',
  description: '',
  category_id: '',
  brand: '',
  size: 'M',
  color: '',
  material: '',
  daily_price: '',
  deposit_amount: '',
  original_value: '',
  quantity: '',
  item_condition: 'good',
  status: 'available',
  images: []
}

const ManageCostumes = () => {
  // State quản lý danh sách
  const [costumes, setCostumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // State quản lý form
  const [isEditing, setIsEditing] = useState(false)
  const [currentCostumeId, setCurrentCostumeId] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])

  // Fetch danh sách trang phục
  useEffect(() => {
    fetchCostumes()
  }, [currentPage])

  const fetchCostumes = async () => {
    setLoading(true)
    try {
      const res = await adminService.getAllCostumes({
        page: currentPage,
        limit: 10
      })
      setCostumes(res.data.costumes)
      setTotalPages(res.data.pagination.pages)
    } catch (err) {
      console.error('Fetch costumes error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ===== XỬ LÝ FORM =====
  // Thêm mới
  const handleAddNew = () => {
    setIsEditing(false)
    setCurrentCostumeId(null)
    setFormData(initialFormData)
    setImageFiles([])
    setImagePreviews([])
    
    // Scroll to form
    document.getElementById('costume-form-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Sửa
  const handleEdit = (costume) => {
    setIsEditing(true)
    setCurrentCostumeId(costume.id)
    setFormData({
      name: costume.name ?? '',
      description: costume.description ?? '',
      category_id: costume.category_id ?? '',
      brand: costume.brand ?? '',
      size: costume.size ?? 'M',
      color: costume.color ?? '',
      material: costume.material ?? '',
      daily_price: costume.daily_price ?? '',
      deposit_amount: costume.deposit_amount ?? '',
      original_value: costume.original_value ?? '',
      quantity: costume.quantity ?? '',
      item_condition: costume.item_condition ?? 'good',
      status: costume.status ?? 'available',
      images: costume.images ?? []
    })
    setImageFiles([])
    setImagePreviews(costume.images ?? [])
    
    // Scroll to form
    document.getElementById('costume-form-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Xóa
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa trang phục này?')) return
    try {
      await adminService.deleteCostume(id)
      alert('Xóa trang phục thành công')
      fetchCostumes()
    } catch (error) {
      console.error('Delete costume error:', error)
      alert('Có lỗi xảy ra khi xóa trang phục')
    }
  }

  // Reset form
  const resetForm = () => {
    setIsEditing(false)
    setCurrentCostumeId(null)
    setFormData(initialFormData)
    setImageFiles([])
    setImagePreviews([])
  }

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Xử lý upload ảnh
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    
    if (files.length > 5) {
      alert('Chỉ có thể upload tối đa 5 ảnh')
      return
    }

    setImageFiles(files)

    // Tạo preview cho ảnh mới
    const previews = files.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...previews])
  }

  // Xóa ảnh preview
  const removeImage = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    
    // Nếu là ảnh mới upload
    if (index >= imagePreviews.length - imageFiles.length) {
      const fileIndex = index - (imagePreviews.length - imageFiles.length)
      setImageFiles(prev => prev.filter((_, i) => i !== fileIndex))
    }
  }

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const data = new FormData()
      
      // Thêm các trường dữ liệu
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'images') {
          data.append(key, value)
        }
      })

      // Thêm file ảnh mới
      imageFiles.forEach(file => {
        data.append('images', file)
      })

      // Gọi API
      if (isEditing && currentCostumeId) {
        await adminService.updateCostume(currentCostumeId, data)
        alert('Cập nhật trang phục thành công')
      } else {
        await adminService.createCostume(data)
        alert('Thêm trang phục thành công')
      }

      // Reset và refresh
      resetForm()
      fetchCostumes()
      
    } catch (error) {
      console.error('Submit costume error:', error)
      alert(isEditing ? 'Cập nhật thất bại' : 'Thêm mới thất bại')
    }
  }

  // Helper hiển thị badge
  const getConditionBadge = (condition) => {
    const styles = {
      excellent: 'bg-green-100 text-green-800 border border-green-200',
      good: 'bg-blue-100 text-blue-800 border border-blue-200',
      fair: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      poor: 'bg-red-100 text-red-800 border border-red-200'
    }
    return styles[condition] || 'bg-gray-100 text-gray-800 border border-gray-200'
  }

  // Tình trạng options
  const conditionOptions = [
    { value: 'excellent', label: 'Rất tốt' },
    { value: 'good', label: 'Tốt' },
    { value: 'fair', label: 'Khá' },
    { value: 'poor', label: 'Kém' }
  ]

  // Trạng thái options
  const statusOptions = [
    { value: 'available', label: 'Có sẵn' },
    { value: 'rented', label: 'Đang thuê' },
    { value: 'maintenance', label: 'Bảo trì' }
  ]

  // Size options
  const sizeOptions = [
    { value: 'XS', label: 'XS' },
    { value: 'S', label: 'S' },
    { value: 'M', label: 'M' },
    { value: 'L', label: 'L' },
    { value: 'XL', label: 'XL' },
    { value: 'XXL', label: 'XXL' },
    { value: 'FREE', label: 'Free size' }
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý trang phục</h1>
        <p className="text-gray-600 mt-1">Quản lý danh sách trang phục cho thuê</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PHẦN TRÁI: Form thêm/sửa */}
        <div id="costume-form-section" className="lg:sticky lg:top-6 lg:self-start">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {isEditing ? 'Chỉnh sửa trang phục' : 'Thêm trang phục mới'}
              </h2>
              {isEditing && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetForm}
                >
                  + Thêm mới
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Thông tin cơ bản */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 border-b pb-2">Thông tin cơ bản</h3>
                <div className="grid grid-cols-1 gap-4">
                  <Input
                    label="Tên trang phục *"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nhập tên trang phục"
                    required
                  />
                  <Input
                    label="Mô tả"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Nhập mô tả trang phục"
                    type="textarea"
                    rows={3}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Thương hiệu"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="Nhập thương hiệu"
                    />
                    <Input
                      label="Mã danh mục *"
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleChange}
                      placeholder="Nhập ID danh mục"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Thông số kỹ thuật */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 border-b pb-2">Thông số kỹ thuật</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size *</label>
                    <select
                      name="size"
                      value={formData.size}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {sizeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <Input
                    label="Màu sắc"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="Ví dụ: Đỏ, Xanh"
                  />
                  
                  <Input
                    label="Chất liệu"
                    name="material"
                    value={formData.material}
                    onChange={handleChange}
                    placeholder="Ví dụ: Vải, Da"
                  />
                  
                  <Input
                    label="Số lượng *"
                    name="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng *</label>
                    <select
                      name="item_condition"
                      value={formData.item_condition}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {conditionOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái *</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Giá cả */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 border-b pb-2">Giá cả</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Giá thuê/ngày *"
                    name="daily_price"
                    type="number"
                    min="0"
                    value={formData.daily_price}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Tiền cọc *"
                    name="deposit_amount"
                    type="number"
                    min="0"
                    value={formData.deposit_amount}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Giá trị gốc"
                    name="original_value"
                    type="number"
                    min="0"
                    value={formData.original_value}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Hình ảnh */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 border-b pb-2">Hình ảnh</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload hình ảnh (tối đa 5 ảnh)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  />
                </div>
                
                {/* Preview images */}
                {imagePreviews.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Ảnh preview ({imagePreviews.length} ảnh):</p>
                    <div className="flex flex-wrap gap-2">
                      {imagePreviews.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`Preview ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Hủy
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  className="min-w-[120px]"
                >
                  {isEditing ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* PHẦN PHẢI: Danh sách trang phục */}
        <div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Danh sách trang phục</h2>
                <p className="text-sm text-gray-600 mt-1">Tổng: {costumes.length} trang phục</p>
              </div>
              <Button onClick={handleAddNew} variant="primary">
                + Thêm trang phục
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
              </div>
            ) : costumes.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Chưa có trang phục nào. Hãy thêm trang phục mới!
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trang phục
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SL
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Giá
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {costumes.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <img
                                src={item.images?.[0] || '/placeholder-costume.jpg'}
                                alt={item.name}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              />
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">{item.name}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {item.brand && <span className="text-gray-400">{item.brand} • </span>}
                                  {item.category_name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                              {item.size}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              item.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="font-medium">{formatMoney(item.daily_price)}</div>
                            <div className="text-xs text-gray-500">
                              Cọc: {formatMoney(item.deposit_amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getConditionBadge(item.item_condition)}`}>
                              {item.item_condition === 'excellent' && 'Rất tốt'}
                              {item.item_condition === 'good' && 'Tốt'}
                              {item.item_condition === 'fair' && 'Khá'}
                              {item.item_condition === 'poor' && 'Kém'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-800 font-medium text-sm px-3 py-1 rounded hover:bg-red-50 transition-colors"
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManageCostumes