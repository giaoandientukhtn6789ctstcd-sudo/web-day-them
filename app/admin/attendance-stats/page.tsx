'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, BarChart2, Calendar, UserX, Clock, ShieldAlert } from 'lucide-react'

export default function AttendanceStatsPage() {
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchAttendanceStats()
  }, [])

  const fetchAttendanceStats = async () => {
    setLoading(true)
    // Lấy toàn bộ học sinh và lịch sử điểm danh
    const { data: students } = await supabase.from('users').select('*').eq('role', 'student')
    const { data: attendanceData } = await supabase.from('attendance').select('*, classes(class_name)')

    if (students && attendanceData) {
      const summary = students.map((st) => {
        const studentRecords = attendanceData.filter((a) => a.student_id === st.id)
        const absents = studentRecords.filter((a) => a.status === 'Absent')
        const lates = studentRecords.filter((a) => a.status === 'Late')

        return {
          ...st,
          totalAbsent: absents.length,
          absentDates: absents.map((a) => `${a.attendance_date} (${a.classes?.class_name || 'Lớp'})`),
          totalLate: lates.length,
          lateDetails: lates.map((a) => `${a.attendance_date} (${a.late_minutes || 0} phút)`),
        }
      })
      // Sắp xếp học sinh có số lần vắng hoặc trễ nhiều lên đầu
      summary.sort((a, b) => (b.totalAbsent + b.totalLate) - (a.totalAbsent + a.totalLate))
      setStats(summary)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/admin/attendance')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Điểm danh</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <BarChart2 className="h-6 w-6 text-indigo-600" />
            <span>Thống kê Vắng mặt & Đi trễ của Học sinh</span>
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center space-x-2 text-gray-700 font-bold">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <span>Bảng tổng hợp cảnh báo chuyên cần</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Đang tổng hợp dữ liệu thống kê...</div>
          ) : stats.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Chưa có dữ liệu điểm danh.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b">
                    <th className="p-4 px-6">Mã HS</th>
                    <th className="p-4">Họ và tên học sinh</th>
                    <th className="p-4 text-center">Tổng số lần Vắng</th>
                    <th className="p-4">Chi tiết ngày vắng</th>
                    <th className="p-4 text-center">Tổng số lần Trễ</th>
                    <th className="p-4 px-6">Chi tiết ngày trễ & số phút</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {stats.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 px-6 font-semibold text-indigo-600">{item.student_code}</td>
                      <td className="p-4 font-bold text-gray-900">{item.full_name}</td>
                      
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.totalAbsent > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {item.totalAbsent} buổi
                        </span>
                      </td>

                      <td className="p-4 text-xs text-gray-600">
                        {item.absentDates.length > 0 ? item.absentDates.join(', ') : <span className="text-gray-400 italic">Không có</span>}
                      </td>

                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.totalLate > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                          {item.totalLate} lần
                        </span>
                      </td>

                      <td className="p-4 px-6 text-xs text-gray-600">
                        {item.lateDetails.length > 0 ? item.lateDetails.join(', ') : <span className="text-gray-400 italic">Không có</span>}
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