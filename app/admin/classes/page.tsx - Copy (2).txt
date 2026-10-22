'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, BookOpen, Plus, Trash2, Users, Clock } from 'lucide-react'

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [classStudents, setClassStudents] = useState<any[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])
  
  const [className, setClassName] = useState('')
  const [subject, setSubject] = useState('Toán')
  const [grade, setGrade] = useState('Khối 6')
  const [schedule, setSchedule] = useState('Thứ 2 (17:30) - Thứ 4 (17:30) - Thứ 6 (19:00)') // Cho phép nhập linh hoạt lịch và giờ theo từng buổi
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [sttNumber, setSttNumber] = useState('1')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchClasses()
    fetchAllStudents()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents(selectedClass.id)
    }
  }, [selectedClass])

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*').order('class_name')
    if (data) {
      setClasses(data)
      if (data.length > 0 && !selectedClass) {
        setSelectedClass(data[0])
      }
    }
  }

  const fetchAllStudents = async () => {
    const { data } = await supabase.from('users').select('*').eq('role', 'student').order('full_name')
    if (data) setAllStudents(data)
  }

  const fetchClassStudents = async (classId: string) => {
    const { data } = await supabase
      .from('class_students')
      .select(`id, stt, users:student_id (id, full_name, student_code)`)
      .eq('class_id', classId)
      .order('stt', { ascending: true })
    if (data) setClassStudents(data)
  }

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!className.trim()) return

    const { error } = await supabase.from('classes').insert([
      {
        class_name: className.trim(),
        subject,
        grade,
        schedule: schedule.trim(), // Lưu chuỗi lịch học chi tiết vào cột schedule
        start_time: 'Linh hoạt',     // Gán mặc định vì giờ đã được tích hợp chi tiết trong lịch
      },
    ])

    if (error) {
      alert('Lỗi tạo lớp: ' + error.message)
    } else {
      setClassName('')
      setSchedule('Thứ 2 (17:30) - Thứ 4 (17:30) - Thứ 6 (19:00)')
      setIsModalOpen(false)
      fetchClasses()
    }
  }

  const handleDeleteClass = async (classId: string) => {
    if (confirm('Bạn có chắc muốn xóa lớp học này không?')) {
      await supabase.from('classes').delete().eq('id', classId)
      setSelectedClass(null)
      fetchClasses()
    }
  }

  const handleAddStudentToClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClass || !selectedStudentId) return

    const { error } = await supabase.from('class_students').insert([
      {
        class_id: selectedClass.id,
        student_id: selectedStudentId,
        stt: parseInt(sttNumber) || 1,
      },
    ])

    if (error) {
      alert('Học sinh đã có trong lớp hoặc lỗi: ' + error.message)
    } else {
      setSelectedStudentId('')
      fetchClassStudents(selectedClass.id)
    }
  }

  const handleRemoveStudent = async (relationId: string) => {
    if (confirm('Xóa học sinh này khỏi lớp?')) {
      await supabase.from('class_students').delete().eq('id', relationId)
      fetchClassStudents(selectedClass.id)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.location.href = '/admin'}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Quản trị</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition font-medium cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>Tạo lớp học mới</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <span>Danh sách Lớp học</span>
            </h2>

            {classes.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có lớp học nào.</p>
            ) : (
              <div className="space-y-3">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className={`p-4 rounded-xl border transition cursor-pointer space-y-2 ${
                      selectedClass?.id === cls.id
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                        : 'border-gray-100 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900">{cls.class_name}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClass(cls.id)
                        }}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-semibold">{cls.subject}</span>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-semibold">{cls.grade}</span>
                    </div>
                    <p className="text-xs text-gray-600 flex items-start space-x-1 pt-1">
                      <Clock className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{cls.schedule}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            {selectedClass ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedClass.class_name}</h2>
                    <p className="text-xs text-indigo-600 font-semibold mt-1">
                      Lịch học chi tiết: {selectedClass.schedule} | Môn: {selectedClass.subject}
                    </p>
                  </div>
                  <button
                    onClick={() => window.location.href = '/admin/attendance'}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Điểm danh lớp này ngay
                  </button>
                </div>

                <form onSubmit={handleAddStudentToClass} className="bg-gray-50 p-4 rounded-xl flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Chọn học sinh</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Chọn học sinh --</option>
                      {allStudents.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.full_name} ({st.student_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Số thứ tự (STT)</label>
                    <input
                      type="number"
                      value={sttNumber}
                      onChange={(e) => setSttNumber(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition shadow-sm cursor-pointer"
                  >
                    Thêm vào lớp
                  </button>
                </form>

                <div className="space-y-3">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center space-x-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <span>Danh sách học sinh ({classStudents.length})</span>
                  </h3>

                  {classStudents.length === 0 ? (
                    <p className="text-sm text-gray-500 p-4 text-center bg-gray-50 rounded-xl">Chưa có học sinh trong lớp.</p>
                  ) : (
                    <div className="border rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b">
                            <th className="p-3 px-4">STT</th>
                            <th className="p-3">Mã HS</th>
                            <th className="p-3">Họ và tên</th>
                            <th className="p-3 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                          {classStudents.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition">
                              <td className="p-3 px-4 font-bold text-indigo-600">{item.stt}</td>
                              <td className="p-3 font-semibold text-gray-700">{item.users?.student_code}</td>
                              <td className="p-3 font-bold text-gray-900">{item.users?.full_name}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleRemoveStudent(item.id)}
                                  className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 p-12 text-center">Vui lòng chọn một lớp học bên cột trái.</p>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">Tạo Lớp Học Mới</h2>
            
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên lớp học</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ví dụ: Lớp Toán 6..."
                  required
                  className="w-full px-4 py-2 border rounded-lg outline-none text-sm text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Môn học</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white text-sm outline-none"
                  >
                    <option value="Toán">Toán</option>
                    <option value="Ngữ Văn">Ngữ Văn</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Khoa học tự nhiên">Khoa học tự nhiên</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khối lớp</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white text-sm outline-none"
                  >
                    <option value="Khối 6">Khối 6</option>
                    <option value="Khối 7">Khối 7</option>
                    <option value="Khối 8">Khối 8</option>
                    <option value="Khối 9">Khối 9</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lịch học & Giờ học chi tiết</label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="Ví dụ: T2 (17:30) - T4 (17:30) - T6 (19:00)"
                  required
                  className="w-full px-4 py-2 border rounded-lg outline-none text-sm text-gray-800"
                />
                <p className="text-xs text-gray-400 mt-1">Bạn có thể ghi rõ giờ học riêng cho từng thứ trong tuần.</p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 text-sm font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-indigo-700 transition"
                >
                  Tạo lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}