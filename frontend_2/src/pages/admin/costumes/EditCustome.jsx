import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { adminService } from '../../../services/admin.service'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'

const EditCostume = ({ onClose, onUpdated }) => {
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
    brand: '',
    size: '',
    color: '',
    material: '',
    daily_price: '',
    deposit_amount: '',
    original_value: '',
    quantity: '',
    available_quantity: '',
    item_condition: '',
    status: '',
    images: []
  })

  //  FETCH DETAIL 
  useEffect(() => {
    const fetchCostume = async () => {
      try {
        const res = await adminService.getCostumeById(id)
        const data = res.data?.data || res.data

        if (!data) return

        setForm({
          name: data.name || '',
          description: data.description || '',
          category_id: data.category_id || '',
          brand: data.brand || '',
          size: data.size || '',
          color: data.color || '',
          material: data.material || '',
          daily_price: data.daily_price || '',
          deposit_amount: data.deposit_amount || '',
          original_value: data.original_value || '',
          quantity: data.quantity || '',
          available_quantity: data.available_quantity || '',
          item_condition: data.item_condition || '',
          status: data.status || '',
          images: Array.isArray(data.images) ? data.images : []
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCostume()
  }, [id])

  
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      await adminService.updateCostume(id, form)
      alert('Cập nhật thành công')

      onUpdated?.() // reload list nếu có
      onClose?.()   // đóng modal
    } catch (err) {
      console.error(err)
      alert('Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-3xl rounded-lg p-6 relative">
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold mb-4">
          Sửa trang phục
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Tên" name="name" value={form.name} onChange={handleChange} />
          <Input label="Mô tả" name="description" value={form.description} onChange={handleChange} />
          <Input label="Brand" name="brand" value={form.brand} onChange={handleChange} />
          <Input label="Size" name="size" value={form.size} onChange={handleChange} />
          <Input label="Màu" name="color" value={form.color} onChange={handleChange} />
          <Input label="Chất liệu" name="material" value={form.material} onChange={handleChange} />

          <Input label="Giá thuê / ngày" name="daily_price" value={form.daily_price} onChange={handleChange} />
          <Input label="Tiền cọc" name="deposit_amount" value={form.deposit_amount} onChange={handleChange} />
          <Input label="Giá gốc" name="original_value" value={form.original_value} onChange={handleChange} />

          <Input label="Số lượng" name="quantity" value={form.quantity} onChange={handleChange} />
          <Input label="Còn lại" name="available_quantity" value={form.available_quantity} onChange={handleChange} />

          <Input label="Tình trạng" name="item_condition" value={form.item_condition} onChange={handleChange} />
          <Input label="Trạng thái" name="status" value={form.status} onChange={handleChange} />

          {/* IMAGE PREVIEW */}
          {form.images.length > 0 && (
            <div className="flex gap-2">
              {form.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  className="w-20 h-20 object-cover rounded border"
                />
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Huỷ
            </Button>

            <Button type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditCostume
