import { useState, useEffect } from 'react'
import { formatDate } from '../../../utils/formatDate'
import Pagination from '../../../components/ui/Pagination'
import adminService from '../../../services/admin.service'

const ManageUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchUsers()
  }, [currentPage])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await adminService.getAllUsers({
        page: currentPage,
        limit: 10
      })
      setUsers(res.data.users || [])
      setTotalPages(res.data.pagination?.pages || 1)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (id, currentStatus) => {
    if (!confirm(`Xác nhận ${currentStatus === 'active' ? 'khóa' : 'mở khóa'} tài khoản này?`)) {
      return
    }

    try {
      const newStatus = currentStatus === 'active' ? 'banned' : 'active'
      await adminService.updateUserStatus(id, newStatus)
      
      // Update local state
      setUsers(users.map(user => 
        user.id === id ? { ...user, status: newStatus } : user
      ))
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Không thể cập nhật trạng thái người dùng')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Quản lý người dùng</h1>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Quản lý người dùng</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Người dùng</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Số điện thoại</th>
              <th className="px-4 py-3 text-left">Vai trò</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-left">Ngày tạo</th>
              <th className="px-4 py-3 text-left">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-4 py-3">{user.full_name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.phone || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : 'Khách hàng'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </td>
                <td className="px-4 py-3">{formatDate(user.created_at)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleUserStatus(user.id, user.status)}
                    className={`px-3 py-1 text-sm rounded ${
                      user.status === 'active'
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {user.status === 'active' ? 'Khóa' : 'Mở khóa'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  )
}

export default ManageUsers