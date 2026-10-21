'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { LogIn, UserCheck, Lock } from 'lucide-react'

export default function LoginPage() {
  const [studentCode, setStudentCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentCode.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ mã định danh và mật khẩu!')
      return
    }

    setLoading(true)
    setErrorMsg('')

    // Truy vấn kiểm tra thông tin tài khoản
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('student_code', studentCode.trim())
      .limit(1)

    setLoading(false)

    if (error) {
      setErrorMsg('Lỗi kết nối cơ sở dữ liệu: ' + error.message)
      return
    }

    if (!data || data.length === 0) {
      setErrorMsg('Mã định danh không tồn tại trên hệ thống!')
      return
    }

    const user = data[0]

    // Kiểm tra mật khẩu (mặc định là 123456 nếu chưa đổi)
    const dbPassword = user.password || '123456'
    if (password !== dbPassword) {
      setErrorMsg('Mật khẩu không chính xác!')
      return
    }

    // Lưu thông tin người dùng vào localStorage
    localStorage.setItem('currentUser', JSON.stringify(user))

    // Phân quyền chuyển hướng thông minh
    if (user.role === 'admin' || user.student_code?.toUpperCase().startsWith('ADMIN') || user.student_code?.toUpperCase().startsWith('TA')) {
      router.push('/admin') // Chuyển đến trang quản trị của giáo viên/trợ giảng
    } else {
      router.push('/dashboard') // Chuyển đến trang học tập của học sinh
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <UserCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Hệ thống Quản lý Học tập</h1>
          <p className="text-sm text-gray-500">Đăng nhập dành cho Admin, Trợ giảng và Học sinh</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã định danh / Mã học sinh
            </label>
            <input
              type="text"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              placeholder="Nhập mã (Ví dụ: ADMIN01 hoặc HS001)..."
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-800 text-sm transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu của bạn..."
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-800 text-sm transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-100 transition flex items-center justify-center space-x-2"
          >
            <LogIn className="h-5 w-5" />
            <span>{loading ? 'Đang xác thực...' : 'Đăng nhập ngay'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-100">
          Mật khẩu mặc định: <span className="font-semibold text-gray-600"></span>
        </div>
      </div>
    </div>
  )
}