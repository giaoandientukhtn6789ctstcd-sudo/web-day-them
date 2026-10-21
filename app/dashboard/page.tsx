'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { BookOpen, Trophy, LogOut, Calendar, Bell, UserCheck } from 'lucide-react'

export default function StudentDashboard() {
  const [student, setStudent] = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (!storedUser) {
      router.push('/login')
    } else {
      const parsed = JSON.parse(storedUser)
      if (parsed.role !== 'student') {
        router.push('/admin')
      } else {
        setStudent(parsed)
        fetchUnreadNotifications(parsed.id)
      }
    }
  }, [router])

  const fetchUnreadNotifications = async (studentId: string) => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('is_read', false)

    if (count !== null) {
      setUnreadCount(count)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header với biểu tượng Chuông thông báo có huy hiệu */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg">
              {student?.full_name ? student.full_name.charAt(0).toUpperCase() : 'HS'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{student?.full_name || 'Học sinh'}</h1>
              <p className="text-xs text-indigo-600 font-semibold">Mã học sinh: {student?.student_code || 'HS001'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Nút Chuông thông báo có hiệu ứng huy hiệu (Badge) */}
            <button
              onClick={() => router.push('/dashboard/notifications')}
              className="relative p-2.5 bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 rounded-xl transition cursor-pointer"
              title="Thông báo chuyên cần"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-semibold transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Banner chào mừng */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-2xl text-white shadow-md space-y-2">
          <h2 className="text-2xl font-bold">Chào mừng bạn trở lại học tập!</h2>
          <p className="text-sm text-indigo-100">Hãy hoàn thành các bài tập và theo dõi tiến độ học tập cũng như chuyên cần của mình tại đây.</p>
        </div>

        {/* Grid các chức năng của học sinh */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Nộp bài tập */}
          <div
            onClick={() => router.push('/dashboard/assignments')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer space-y-4 group"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Bài tập</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Bài tập được giao</h3>
              <p className="text-xs text-gray-500 mt-1">Xem đề bài, tải tài liệu và nộp bài tập trực tuyến.</p>
            </div>
          </div>

          {/* Xem Bảng Xếp Hạng */}
          <div
            onClick={() => router.push('/dashboard/leaderboard')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer space-y-4 group"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                <Trophy className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">Xếp hạng</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Bảng Xếp Hạng Lớp</h3>
              <p className="text-xs text-gray-500 mt-1">Xem vị trí của bạn trong bảng vàng thi đua học tập toàn lớp.</p>
            </div>
          </div>

          {/* Xem Chuyên Cần & Đi Trễ cá nhân */}
          <div
            onClick={() => router.push('/dashboard/attendance')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer space-y-4 group"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Chuyên cần</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Xem Chuyên Cần & Đi Trễ</h3>
              <p className="text-xs text-gray-500 mt-1">Theo dõi lịch sử đi học, số buổi có mặt, số lần vắng và đi trễ của cá nhân.</p>
            </div>
          </div>

          {/* Hộp thư Thông báo Chuyên cần */}
          <div
            onClick={() => router.push('/dashboard/notifications')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer space-y-4 group"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                <Bell className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">Hộp thư</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Thông báo</h3>
              <p className="text-xs text-gray-500 mt-1">Xem các cảnh báo do giáo viên gửi đến.</p>
            </div>
          </div>

          {/* Trạng thái tài khoản */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <UserCheck className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Hoạt động</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Trạng thái tài khoản</h3>
              <p className="text-xs text-green-600 font-semibold mt-1">Tài khoản đang hoạt động bình thường.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}