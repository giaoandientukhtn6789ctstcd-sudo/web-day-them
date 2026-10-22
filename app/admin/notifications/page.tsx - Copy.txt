'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Send, MessageSquare, Bell } from 'lucide-react'

export default function AdminNotificationsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    const { data } = await supabase.from('users').select('*').eq('role', 'student').order('full_name')
    if (data) setStudents(data)
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung dặn dò!')
      return
    }

    setLoading(true)

    if (selectedStudentId === 'all') {
      // Gửi cho tất cả học sinh
      const payloads = students.map((st) => ({
        student_id: st.id,
        title: title.trim(),
        message: message.trim(),
        type: 'teacher_note',
      }))
      const { error } = await supabase.from('notifications').insert(payloads)
      if (error) alert('Lỗi gửi thông báo: ' + error.message)
      else alert('Đã gửi thông báo dặn dò đến toàn bộ học sinh thành công!')
    } else {
      // Gửi cho 1 học sinh cụ thể
      const { error } = await supabase.from('notifications').insert([
        {
          student_id: selectedStudentId,
          title: title.trim(),
          message: message.trim(),
          type: 'teacher_note',
        },
      ])
      if (error) alert('Lỗi gửi thông báo: ' + error.message)
      else alert('Đã gửi thông báo dặn dò thành công!')
    }

    setTitle('')
    setMessage('')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header tích hợp nút Quản lý / Thu hồi thông báo */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-gray-100 px-4 py-2 rounded-lg transition text-sm font-semibold cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Quản trị</span>
          </button>
          
          <button
            onClick={() => router.push('/admin/notifications/manage')}
            className="flex items-center space-x-2 text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition text-sm font-semibold shadow-sm cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            <span>Quản lý / Thu hồi thông báo</span>
          </button>
        </div>

        <form onSubmit={handleSendNotification} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Gửi Dặn dò đến Học sinh</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gửi tới học sinh</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">🌐 Gửi cho toàn bộ học sinh</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  👤 {st.full_name} ({st.student_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề dặn dò</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Nhắc nhở làm bài tập về nhà..."
              required
              className="w-full px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung chi tiết</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập nội dung dặn dò học sinh..."
              rows={4}
              required
              className="w-full px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-sm cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>{loading ? 'Đang gửi...' : 'Gửi thông báo dặn dò'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}