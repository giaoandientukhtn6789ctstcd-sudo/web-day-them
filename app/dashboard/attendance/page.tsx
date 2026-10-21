'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function StudentAttendancePage() {
  const [student, setStudent] = useState<any>(null)
  const [attendanceList, setAttendanceList] = useState<any[]>([])
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
    fetchStudentAttendance(parsed.id)
  }, [router])

  const fetchStudentAttendance = async (studentId: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('attendance')
      .select('*, classes(class_name, subject)')
      .eq('student_id', studentId)
      .order('attendance_date', { ascending: false })

    if (data) {
      setAttendanceList(data)
    }
    setLoading(false)
  }

  const totalAbsent = attendanceList.filter((a) => a.status === 'Absent').length
  const totalLate = attendanceList.filter((a) => a.status === 'Late').length
  const totalPresent = attendanceList.filter((a) => a.status === 'Present').length

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-gray-100 px-4 py-2 rounded-lg transition text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Trang chủ</span>
          </button>
          <div className="text-right">
            <h1 className="text-xl font-bold text-gray-900">{student?.full_name}</h1>
            <p className="text-xs text-indigo-600 font-semibold">Mã học sinh: {student?.student_code}</p>
          </div>
        </div>

        {/* Thẻ tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex items-center space-x-4">
            <div className="h-12 w-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center font-bold">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Có mặt</p>
              <p className="text-2xl font-bold text-gray-900">{totalPresent} buổi</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100 flex items-center space-x-4">
            <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Đi trễ</p>
              <p className="text-2xl font-bold text-gray-900">{totalLate} lần</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex items-center space-x-4">
            <div className="h-12 w-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-bold">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Vắng mặt</p>
              <p className="text-2xl font-bold text-gray-900">{totalAbsent} buổi</p>
            </div>
          </div>
        </div>

        {/* Danh sách chi tiết chuyên cần */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 font-bold text-gray-800 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <span>Lịch sử điểm danh cá nhân</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Đang tải lịch sử điểm danh...</div>
          ) : attendanceList.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-2">
              <p className="font-semibold">Chưa có dữ liệu điểm danh nào được ghi nhận.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b">
                    <th className="p-4 px-6">Ngày học</th>
                    <th className="p-4">Lớp học</th>
                    <th className="p-4 text-center">Trạng thái</th>
                    <th className="p-4 px-6">Chi tiết thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {attendanceList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 px-6 font-bold text-gray-900">{item.attendance_date}</td>
                      <td className="p-4 font-semibold text-indigo-600">{item.classes?.class_name || 'Lớp học'}</td>
                      <td className="p-4 text-center">
                        {item.status === 'Present' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Có mặt</span>
                        )}
                        {item.status === 'Late' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Đi trễ</span>
                        )}
                        {item.status === 'Absent' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Vắng mặt</span>
                        )}
                      </td>
                      <td className="p-4 px-6 text-xs text-gray-600">
                        {item.status === 'Present' && <span>Giờ vào: {item.check_in_time}</span>}
                        {item.status === 'Late' && (
                          <span className="font-bold text-amber-600">
                            Giờ vào: {item.check_in_time} (Trễ {item.late_minutes || 0} phút)
                          </span>
                        )}
                        {item.status === 'Absent' && <span className="text-red-500 italic">Không có mặt tại lớp</span>}
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