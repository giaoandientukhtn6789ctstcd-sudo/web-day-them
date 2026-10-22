'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Calendar, Clock, BookOpen } from 'lucide-react'

export default function AdminSchedulePage() {
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchClassesSchedule()
  }, [])

  const fetchClassesSchedule = async () => {
    setLoading(true)
    const { data } = await supabase.from('classes').select('*').order('class_name')
    if (data) {
      setClasses(data)
    }
    setLoading(false)
  }

  // Danh sách các thứ trong tuần để hiển thị bảng TKB
  const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật']

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header điều hướng */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-gray-100 px-4 py-2 rounded-lg transition text-sm font-semibold cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại Quản trị</span>
            </button>
            <button
              onClick={() => router.push('/admin/attendance')}
              className="flex items-center space-x-2 text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition text-sm font-semibold shadow-sm cursor-pointer"
            >
              <Calendar className="h-4 w-4" />
              <span>Điểm danh lớp học</span>
            </button>
          </div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            <span>Thời Khóa Biểu 1 Tuần Của Trung Tâm</span>
          </h1>
        </div>

        {/* Bảng Thời khóa biểu chi tiết */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center space-x-2 text-gray-800 font-bold">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <span>Bảng tổng hợp Lớp & Thời gian bắt đầu theo thứ</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Đang tải thời khóa biểu...</div>
          ) : classes.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Chưa có lớp học nào được tạo.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-600 uppercase border-b">
                    <th className="p-4 px-6 min-w-[180px]">Lớp học / Môn</th>
                    {daysOfWeek.map((day) => (
                      <th key={day} className="p-4 text-center min-w-[130px] border-l border-gray-100">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {classes.map((cls) => {
                    // Phân tích lịch học chi tiết của lớp từ chuỗi schedule hoặc schedule_details
                    let scheduleMap: Record<string, string> = {}
                    try {
                      if (cls.schedule_details) {
                        scheduleMap = cls.schedule_details
                      } else if (cls.schedule) {
                        // Tự động phân tích từ chuỗi (Ví dụ: "Thứ 2: 17:30 | Thứ 4: 19:00")
                        const parts = cls.schedule.split('|')
                        parts.forEach((p: string) => {
                          const [d, t] = p.split(':')
                          if (d && t) {
                            scheduleMap[d.trim()] = t.trim()
                          }
                        })
                      }
                    } catch (e) {
                      // Bỏ qua nếu lỗi định dạng
                    }

                    return (
                      <tr key={cls.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 px-6">
                          <div className="font-bold text-gray-900">{cls.class_name}</div>
                          <div className="text-xs text-indigo-600 font-semibold mt-0.5">
                            {cls.subject} ({cls.grade})
                          </div>
                        </td>
                        {daysOfWeek.map((day) => {
                          const timeVal = scheduleMap[day] || (cls.schedule?.includes(day) ? 'Có lịch' : '')
                          return (
                            <td key={day} className="p-4 text-center border-l border-gray-100">
                              {timeVal ? (
                                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold shadow-xs">
                                  <Clock className="h-3 w-3" />
                                  <span>{timeVal}</span>
                                </span>
                              ) : (
                                <span className="text-xs text-gray-300">- Nghỉ -</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}