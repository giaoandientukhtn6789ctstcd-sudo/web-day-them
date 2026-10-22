'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Send, MessageSquare, Bell, CheckSquare, Square } from 'lucide-react'

export default function AdminNotificationsPage() {
  const [classesList, setClassesList] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [classStudents, setClassStudents] = useState<any[]>([])
  
  const [selectedClassId, setSelectedClassId] = useState<string>('all')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchClassesAndStudents()
  }, [])

  const fetchClassesAndStudents = async () => {
    // Lấy danh sách lớp học
    const { data: classData } = await supabase.from('classes').select('*').order('class_name', { ascending: true })
    if (classData) setClassesList(classData)

    // Lấy danh sách học sinh
    const { data: studentData } = await supabase.from('users').select('*').eq('role', 'student').order('full_name')
    if (studentData) setStudents(studentData)

    // Lấy liên kết học sinh - lớp học (bảng class_students)
    const { data: csData } = await supabase.from('class_students').select('*')
    if (csData) setClassStudents(csData)
  }

  // Lọc danh sách học sinh dựa trên lớp được chọn
  const filteredStudents = selectedClassId === 'all' 
    ? students 
    : students.filter(st => {
        // Kiểm tra xem học sinh có thuộc lớp có ID hoặc class_name tương ứng không
        const matchedClass = classesList.find(c => c.id === selectedClassId)
        return classStudents.some(cs => 
          (cs.student_id === st.id || cs.user_id === st.id) && 
          (cs.class_id === selectedClassId || cs.class_name === matchedClass?.class_name)
        )
      })

  const handleSelectAll = () => {
    const allFilteredIds = filteredStudents.map(st => st.id)
    const isAllSelected = allFilteredIds.every(id => selectedStudentIds.includes(id))
    
    if (isAllSelected) {
      // Bỏ chọn tất cả học sinh đang hiển thị
      setSelectedStudentIds(prev => prev.filter(id => !allFilteredIds.includes(id)))
    } else {
      // Chọn thêm tất cả học sinh đang hiển thị
      const combined = Array.from(new Set([...selectedStudentIds, ...allFilteredIds]))
      setSelectedStudentIds(combined)
    }
  }

  const handleToggleStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(prev => prev.filter(item => item !== id))
    } else {
      setSelectedStudentIds(prev => [...prev, id])
    }
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung dặn dò!')
      return
    }

    if (selectedStudentIds.length === 0) {
      alert('Vui lòng chọn ít nhất một học sinh để gửi dặn dò!')
      return
    }

    setLoading(true)

    const payloads = selectedStudentIds.map((studentId) => ({
      student_id: studentId,
      title: title.trim(),
      message: message.trim(),
      type: 'teacher_note',
    }))

    const { error } = await supabase.from('notifications').insert(payloads)

    setLoading(false)

    if (error) {
      alert('Lỗi gửi thông báo: ' + error.message)
    } else {
      alert(`Đã gửi thông báo dặn dò thành công cho ${selectedStudentIds.length} học sinh!`)
      setTitle('')
      setMessage('')
      setSelectedStudentIds([])
    }
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

        <form onSubmit={handleSendNotification} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Gửi Dặn dò đến Học sinh theo Lớp</h2>
          </div>

          {/* Chọn Lớp để lọc */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Lớp học</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">🌐 Tất cả các lớp (Toàn bộ học sinh)</option>
              {classesList.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  📚 {cls.class_name} {cls.subject ? `(${cls.subject})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Danh sách tích chọn nhiều học sinh */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Chọn học sinh nhận thông báo ({selectedStudentIds.length} đã chọn)
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
              >
                {filteredStudents.length > 0 && filteredStudents.every(st => selectedStudentIds.includes(st.id)) 
                  ? 'Bỏ chọn tất cả' 
                  : 'Chọn tất cả trong danh sách'}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-xl p-3 space-y-2 bg-gray-50/50">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-500">Không tìm thấy học sinh nào trong lớp này.</div>
              ) : (
                filteredStudents.map((st) => {
                  const isChecked = selectedStudentIds.includes(st.id)
                  return (
                    <div
                      key={st.id}
                      onClick={() => handleToggleStudent(st.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition ${
                        isChecked ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Đã xử lý bằng sự kiện click của div cha
                          className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="font-semibold">{st.full_name}</span>
                        <span className="text-xs text-gray-500">({st.student_code || 'Chưa có mã'})</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
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
            <span>{loading ? 'Đang gửi...' : `Gửi thông báo dặn dò (${selectedStudentIds.length} học sinh)`}</span>
          </button>
        </form>
      </div>
    </div>
  )
}