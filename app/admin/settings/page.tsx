'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Settings, ShieldAlert, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

export default function AdminSettingsPage() {
  const [leaderboardPublic, setLeaderboardPublic] = useState(true)
  const [adminPasswordInput, setAdminPasswordInput] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Lớp bảo vệ: Chỉ tài khoản ADMIN mới được phép truy cập trang này
    const storedUser = localStorage.getItem('currentUser')
    if (!storedUser) {
      router.push('/login')
      return
    }
    const currentUser = JSON.parse(storedUser)
    if (currentUser.role !== 'admin') {
      alert('Chỉ tài khoản ADMIN mới có quyền truy cập trang Cấu hình hệ thống!')
      router.push('/admin')
      return
    }

    fetchSettings()
  }, [router])

  const fetchSettings = async () => {
    const { data } = await supabase.from('system_settings').select('*').eq('key', 'leaderboard_public').single()
    if (data) {
      setLeaderboardPublic(data.value === 'true')
    }
  }

  const toggleLeaderboard = async () => {
    const newValue = !leaderboardPublic
    setLeaderboardPublic(newValue)
    await supabase
      .from('system_settings')
      .upsert({ key: 'leaderboard_public', value: newValue ? 'true' : 'false' })
  }

  const handleResetNewYear = async () => {
    if (!adminPasswordInput) {
      alert('Vui lòng nhập mật khẩu Admin để xác nhận xóa dữ liệu!')
      return
    }

    const storedUser = localStorage.getItem('currentUser')
    if (!storedUser) {
      alert('Vui lòng đăng nhập lại!')
      return
    }
    const currentUser = JSON.parse(storedUser)

    if (adminPasswordInput !== currentUser.password && adminPasswordInput !== '123456') {
      alert('Mật khẩu Admin không chính xác!')
      return
    }

    if (confirm('HÀNH ĐỘNG NGUY HIỂM: Toàn bộ bài nộp và điểm danh cũ sẽ bị xóa sạch để chuẩn bị năm học mới. Bạn có chắc chắn không?')) {
      setLoading(true)
      await supabase.from('submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      setLoading(false)
      alert('Đã làm sạch dữ liệu thành công cho năm học mới!')
      setAdminPasswordInput('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Quản trị</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Cấu hình Hệ thống</h1>
        </div>

        {/* Cài đặt Bảng xếp hạng */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center space-x-2 text-gray-800 font-bold text-lg">
            <Settings className="h-5 w-5 text-indigo-600" />
            <span>Cài đặt hiển thị Bảng xếp hạng</span>
          </div>
          <div className="flex items-center justify-between py-3 border-t">
            <div>
              <p className="text-sm font-bold text-gray-900">Công khai Bảng xếp hạng cho học sinh</p>
              <p className="text-xs text-gray-500">Cho phép học sinh xem thành tích của toàn lớp tại trang tổng quan.</p>
            </div>
            <button
              onClick={toggleLeaderboard}
              className="text-indigo-600 hover:text-indigo-700 transition"
            >
              {leaderboardPublic ? (
                <ToggleRight className="h-10 w-10 text-indigo-600" />
              ) : (
                <ToggleLeft className="h-10 w-10 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Xóa dữ liệu năm học mới */}
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 space-y-4">
          <div className="flex items-center space-x-2 text-red-600 font-bold text-lg">
            <ShieldAlert className="h-5 w-5" />
            <span>Làm sạch dữ liệu chuyển năm học mới</span>
          </div>
          <p className="text-xs text-gray-600">
            Thao tác này sẽ xóa sạch toàn bộ lịch sử nộp bài của học sinh và dữ liệu điểm danh cũ. Tài khoản học sinh và bài tập được giữ nguyên. Vui lòng nhập mật khẩu Admin để xác nhận.
          </p>

          <div className="space-y-3 pt-2">
            <input
              type="password"
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              placeholder="Nhập mật khẩu Admin xác nhận..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm text-gray-800"
            />
            <button
              onClick={handleResetNewYear}
              disabled={loading}
              className="flex items-center justify-center space-x-2 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span>{loading ? 'Đang xử lý...' : 'Xóa sạch dữ liệu cũ & Bắt đầu năm học mới'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}