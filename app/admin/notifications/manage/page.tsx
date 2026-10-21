'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Trash2, Bell, AlertTriangle } from 'lucide-react'

export default function ManageNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*, users:student_id (full_name, student_code)')
      .order('created_at', { ascending: false })

    if (data) {
      setNotifications(data)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi/xóa thông báo này không?')) return

    const { error } = await supabase.from('notifications').delete().eq('id', id)
    if (error) {
      alert('Lỗi khi xóa thông báo: ' + error.message)
    } else {
      setNotifications(notifications.filter((item) => item.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <button
            onClick={() => router.push('/admin/notifications')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-gray-100 px-4 py-2 rounded-lg transition text-sm font-semibold cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Gửi dặn dò</span>
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            <span>Quản lý & Thu hồi Thông báo</span>
          </h1>
        </div>

        {/* Danh sách thông báo đã gửi */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Đang tải danh sách thông báo...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-2">
              <p className="font-semibold">Chưa có thông báo nào được gửi đi.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b">
                    <th className="p-4">Thời gian gửi</th>
                    <th className="p-4">Học sinh nhận</th>
                    <th className="p-4">Tiêu đề & Nội dung</th>
                    <th className="p-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {notifications.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 text-xs text-gray-500 font-medium whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-4 font-semibold text-indigo-600 whitespace-nowrap">
                        {item.users ? `${item.users.full_name} (${item.users.student_code})` : 'Tất cả học sinh'}
                      </td>
                      <td className="p-4 space-y-1">
                        <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                        <p className="text-xs text-gray-600">{item.message}</p>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition cursor-pointer"
                          title="Thu hồi thông báo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Thu hồi</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}