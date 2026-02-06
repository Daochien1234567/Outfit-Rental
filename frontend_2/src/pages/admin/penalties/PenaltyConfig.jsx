import { useState, useEffect } from 'react'
import { formatMoney } from '../../../utils/formatMoney'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import adminService from '../../../services/admin.service'

const PenaltyConfig = () => {
  const [penalties, setPenalties] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    type: 'fixed',
    isActive: true
  })

  useEffect(() => {
    fetchPenalties()
  }, [])

  // FETCH 
  const fetchPenalties = async () => {
    setLoading(true)
    try {
      const res = await adminService.getPenaltyConfig()
      setPenalties(res.data || [])
    } catch (err) {
      alert('Không thể tải danh sách phí phạt')
    } finally {
      setLoading(false)
    }
  }

  
  const handleEdit = (penalty) => {
    setEditingId(penalty.id)
    setFormData({
      name: penalty.name || '',
      description: penalty.description || '',
      amount: penalty.value?.toString() || '',
      type: penalty.calculation_type || 'fixed',
      isActive: penalty.status === 'active'
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      type: 'fixed',
      isActive: true
    })
  }

  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        value: Number(formData.amount),
        calculation_type: formData.type,
        status: formData.isActive ? 'active' : 'inactive'
      }

      const res = await adminService.updatePenaltyConfig(editingId, payload)
      if (!res.success) throw new Error()

      setPenalties(penalties.map(p =>
        p.id === editingId ? { ...p, ...payload } : p
      ))

      alert('Cập nhật thành công')
      handleCancel()
    } catch {
      alert('Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  
  const handleToggleActive = async (penalty) => {
    const newStatus = penalty.status === 'active' ? 'inactive' : 'active'

    try {
      await adminService.updatePenaltyConfig(penalty.id, {
        ...penalty,
        status: newStatus
      })

      setPenalties(penalties.map(p =>
        p.id === penalty.id ? { ...p, status: newStatus } : p
      ))
    } catch {
      alert('Không thể thay đổi trạng thái')
    }
  }

  
  const getTypeText = (type) => ({
    fixed: 'Cố định',
    daily_rate: 'Theo ngày',
    percentage: 'Theo %',
    by_value: 'Theo giá trị'
  }[type] || type)

  const formatAmount = (value, type) =>
    type === 'percentage' ? `${value}%` : formatMoney(value)

  const getCalcText = (p) => {
    if (p.calculation_type === 'daily_rate')
      return `${formatMoney(p.value)} / ngày trễ`
    if (p.calculation_type === 'percentage')
      return `${p.value}% giá trị trang phục`
    if (p.calculation_type === 'by_value')
      return 'Theo giá trị trang phục'
    return 'Số tiền cố định'
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Cấu hình phí phạt</h1>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="space-y-4">
          {penalties.map(p => (
            <div key={p.id} className="p-4 bg-white rounded shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-sm text-gray-500">{p.description}</p>
                </div>

                <button
                  onClick={() => handleToggleActive(p)}
                  className={`px-3 py-1 rounded text-sm ${
                    p.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {p.status === 'active' ? 'Đang áp dụng' : 'Tạm ngưng'}
                </button>
              </div>

              <div className="mt-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold">
                    {formatAmount(p.value, p.calculation_type)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {getCalcText(p)}
                  </p>
                </div>

                <Button onClick={() => handleEdit(p)}>Chỉnh sửa</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingId && (
        <form onSubmit={handleSubmit} className="mt-8 bg-white p-6 rounded shadow space-y-4">
          <Input
            label="Tên phí phạt"
            name="name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />

          <textarea
            className="w-full border rounded p-2"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />

          <Input
            label="Giá trị"
            type="number"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: e.target.value })}
          />

          <select
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value })}
            className="w-full border rounded p-2"
          >
            <option value="fixed">Cố định</option>
            <option value="daily_rate">Theo ngày</option>
            <option value="percentage">Theo %</option>
            <option value="by_value">Theo giá trị</option>
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
            />
            Áp dụng
          </label>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Cập nhật'}
            </Button>
            <Button variant="outline" onClick={handleCancel}>Hủy</Button>
          </div>
        </form>
      )}
    </div>
  )
}

export default PenaltyConfig
