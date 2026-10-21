'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, UserPlus, Users, Trash2, KeyRound, Shield, ShieldAlert } from 'lucide-react'

export default function AdminStudentsPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form states cho thêm tài khoản mới
  const [fullName, setFullName] = useState('')
  const [studentCode, setStudentCode] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student') // student, admin, assistant
  const [permissions, setPermissions] = useState({
    canDeleteAssignment: true,
    canManageStudents: true,
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    if (data) setUsers(data)
    setLoading(false)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !studentCode.trim() || !password.trim()) {
      alert('Vui lòng điền đầy đủ thông tin tài khoản!')
      return
    }

    const { error } = await supabase.from('users').insert([
      {
        full_name: fullName.trim(),
        student_code: studentCode.trim(),
        password: password.trim(),
        role: role,
        permissions: role === 'assistant' ? permissions : null,
      },
    ])

    if (error) {
      alert('Lỗi tạo tài khoản (Có thể mã định danh/ID đã tồn tại): ' + error.message)
    } else {
      setFullName('')
      setStudentCode('')
      setPassword('')
      setRole('student')
      setIsModalOpen(false)
      fetchUsers()
    }
  }

  const handleDelete = async (id: string, code: string) => {
    if (code === 'ADMIN01') {
      alert('Không thể xóa tài khoản Quản trị tối cao này!')
      return
    }
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản này không?')) {
      await supabase.from('users').delete().eq('id', id)
      fetchUsers()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Quản trị</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition font-medium"
          >
            <UserPlus className="h-5 w-5" />
            <span>Thêm tài khoản mới</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center space-x-2 text-gray-700">
            <Users className="h-5 w-5 text-indigo-600" />
            <span className="font-bold">Danh sách tất cả tài khoản trong hệ thống</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải danh sách tài khoản...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Chưa có tài khoản nào.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((u) => (
                <div key={u.id} className="p-6 flex justify-between items-center hover:bg-gray-50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-base font-bold text-gray-900">{u.full_name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'assistant' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {u.role === 'admin' ? 'Quản trị viên (ADMIN)' : u.role === 'assistant' ? 'Trợ giảng' : 'Học sinh'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Mã định danh (ID): <span className="text-indigo-600 font-bold">{u.student_code}</span></p>
                    {u.role === 'assistant' && u.permissions && (
                      <div className="flex items-center space-x-2 text-xs text-amber-600 pt-1">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Quyền hạn: {u.permissions.canDeleteAssignment ? 'Được xóa bài tập' : 'Không được xóa bài tập'} | {u.permissions.canManageStudents ? 'Quản lý học sinh' : 'Hạn chế quản lý học sinh'}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => alert(`Mật khẩu của tài khoản này là: ${u.password}`)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Xem mật khẩu</span>
                    </button>
                    <button
                      onClick={() => handleDelete(u.id, u.student_code)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Xóa tài khoản"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Thêm tài khoản mới */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">Thêm tài khoản mới</h2>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Trợ Giảng..."
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã định danh (ID đăng nhập)</label>
                <input
                  type="text"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder="Ví dụ: TA01 hoặc ADMIN02..."
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò tài khoản</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-800 bg-white"
                >
                  <option value="student">Học sinh</option>
                  <option value="assistant">Trợ giảng (Có giới hạn quyền)</option>
                  <option value="admin">Quản trị viên (ADMIN toàn quyền)</option>
                </select>
              </div>

              {role === 'assistant' && (
                <div className="p-3 bg-amber-50 rounded-lg space-y-2 border border-amber-200">
                  <p className="text-xs font-bold text-amber-800">Cấu hình giới hạn quyền Trợ giảng:</p>
                  <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canDeleteAssignment}
                      onChange={(e) => setPermissions({...permissions, canDeleteAssignment: e.target.checked})}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Cho phép xóa bài tập</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageStudents}
                      onChange={(e) => setPermissions({...permissions, canManageStudents: e.target.checked})}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Cho phép quản lý/thêm xóa học sinh</span>
                  </label>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}