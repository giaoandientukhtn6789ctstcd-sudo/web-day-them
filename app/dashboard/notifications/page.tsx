'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Bell, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function StudentNotificationsPage() {
  const [student, setStudent] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (!storedUser) {
      router.push('/login')
      return
    }
    const parsed = JSON.parse(storedUser)
    if (parsed.role !== 'student') {
      router.push('/admin')
      return
    }
    setStudent(parsed)
    fetchNotifications(parsed.id)
  }, [router])

  const fetchNotifications = async (studentId: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (data) {
      setNotifications(data)
      
      // Tự động cập nhật trạng thái đã đọc (is_read = true) để số đếm trên chuông biến mất
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('student_id', studentId)
        .eq('is_read', false)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-gray-100 px-4 py-2 rounded-lg transition text-sm font-semibold cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Trang chủ</span>
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            <span>Thông báo của tôi</span>
          </h1>
        </div>

        {/* Danh sách thông báo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Đang tải thông báo...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-2">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
              <p className="font-semibold">Bạn không có thông báo cảnh báo nào mới.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 flex items-start space-x-3 transition"
                >
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                      <span className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}