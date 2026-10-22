'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Clock, Users, Calendar, BookOpen, AlertCircle, BarChart2 } from 'lucide-react'

export default function AdminAttendancePage() {
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [classStartTime, setClassStartTime] = useState<string>('18:30')
  
  const [studentsInClass, setStudentsInClass] = useState<any[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setSelectedDate(new Date().toISOString().split('T')[0])
    fetchClasses()
  }, [])

  useEffect(() => {
    if (selectedClassId) {
      const currentCls = classes.find((c) => c.id === selectedClassId)
      if (currentCls && currentCls.start_time) {
        setClassStartTime(currentCls.start_time)
      }
      fetchClassData()
    }
  }, [selectedClassId, selectedDate])

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*').order('class_name')
    if (data && data.length > 0) {
      setClasses(data)
      setSelectedClassId(data[0].id)
      if (data[0].start_time) setClassStartTime(data[0].start_time)
    }
    setLoading(false)
  }

  const fetchClassData = async () => {
    setLoading(true)
    const { data: classStudents } = await supabase
      .from('class_students')
      .select(`stt, users:student_id (id, full_name, student_code)`)
      .eq('class_id', selectedClassId)
      .order('stt', { ascending: true })

    const { data: attendances } = await supabase
      .from('attendance')
      .select('*')
      .eq('class_id', selectedClassId)
      .eq('attendance_date', selectedDate)

    if (classStudents) setStudentsInClass(classStudents)
    if (attendances) setAttendanceRecords(attendances)
    setLoading(false)
  }

  const handleStartTimeChange = async (newTime: string) => {
    setClassStartTime(newTime)
    if (!selectedClassId) return

    await supabase
      .from('classes')
      .update({ start_time: newTime })
      .eq('id', selectedClassId)

    setClasses(classes.map(cls => cls.id === selectedClassId ? { ...cls, start_time: newTime } : cls))
  }

  const calculateLateMinutes = (checkInTime: string, startTime: string) => {
    if (!checkInTime || !startTime) return 0
    const [checkInH, checkInM] = checkInTime.split(':').map(Number)
    const [startH, startM] = startTime.split(':').map(Number)

    const checkInTotalMins = checkInH * 60 + checkInM
    const startTotalMins = startH * 60 + startM

    const diff = checkInTotalMins - startTotalMins
    return diff > 0 ? diff : 0
  }

  const handleAttendanceChange = async (studentId: string, status: string) => {
    const now = new Date()
    const timeString = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    let lateMins = 0
    if (status === 'Late') {
      lateMins = calculateLateMinutes(timeString, classStartTime)
    }

    // 1. Lưu hoặc cập nhật điểm danh
    const { error } = await supabase
      .from('attendance')
      .upsert(
        {
          class_id: selectedClassId,
          student_id: studentId,
          attendance_date: selectedDate,
          status: status,
          check_in_time: timeString,
          late_minutes: lateMins,
        },
        { onConflict: 'class_id,student_id,attendance_date' }
      )

    if (error) {
      alert('Lỗi lưu điểm danh: ' + error.message)
      return
    }

    // 2. Tự động gửi thông báo nội bộ cho học sinh nếu vắng hoặc đi trễ
    if (status === 'Absent') {
      await supabase.from('notifications').insert([
        {
          student_id: studentId,
          title: 'Cảnh báo vắng mặt',
          message: `Bạn đã bị ghi nhận vắng mặt trong buổi học ngày ${selectedDate}.`,
          type: 'warning',
        },
      ])
    } else if (status === 'Late') {
      await supabase.from('notifications').insert([
        {
          student_id: studentId,
          title: 'Cảnh báo đi trễ',
          message: `Bạn đã đi trễ ${lateMins} phút trong buổi học ngày ${selectedDate} (Check-in: ${timeString}).`,
          type: 'warning',
        },
      ])
    }

    fetchClassData()
  }

  const currentClassInfo = classes.find((c) => c.id === selectedClassId)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.location.href = '/admin'}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-gray-100 px-4 py-2 rounded-lg transition text-sm font-semibold cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại Quản trị</span>
            </button>
            <button
              onClick={() => window.location.href = '/admin/attendance-stats'}
              className="flex items-center space-x-2 text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition text-sm font-semibold shadow-sm cursor-pointer"
            >
              <BarChart2 className="h-4 w-4" />
              <span>Thống kê Vắng / Trễ</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-bold text-gray-700">Chọn lớp:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name} ({cls.subject})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-bold text-gray-700">Ngày:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-bold text-gray-700">Giờ bắt đầu:</span>
              <input
                type="time"
                value={classStartTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center space-x-2 text-gray-800 font-bold">
              <Users className="h-5 w-5 text-indigo-600" />
              <span>Điểm danh lớp: {currentClassInfo?.class_name}</span>
            </div>
            <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
              Giờ quy định: {classStartTime}
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Đang tải danh sách học sinh...</div>
          ) : studentsInClass.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-2">
              <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
              <p className="font-semibold">Lớp học này chưa có học sinh nào.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b">
                    <th className="p-4 px-6">STT</th>
                    <th className="p-4">Mã HS</th>
                    <th className="p-4">Họ và tên học sinh</th>
                    <th className="p-4 text-center">Trạng thái điểm danh</th>
                    <th className="p-4 px-6">Chi tiết thời gian & Trễ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {studentsInClass.map((item) => {
                    const student = item.users
                    const record = attendanceRecords.find((a) => a.student_id === student?.id)
                    const status = record ? record.status : 'None'

                    return (
                      <tr key={student?.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 px-6 font-bold text-gray-600">{item.stt}</td>
                        <td className="p-4 font-semibold text-indigo-600">{student?.student_code}</td>
                        <td className="p-4 font-bold text-gray-900">{student?.full_name}</td>
                        <td className="p-4 text-center">
                          <div className="inline-flex rounded-lg p-1 bg-gray-100 space-x-1">
                            <button
                              onClick={() => handleAttendanceChange(student?.id, 'Present')}
                              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                status === 'Present' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              Có mặt
                            </button>
                            <button
                              onClick={() => handleAttendanceChange(student?.id, 'Late')}
                              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                status === 'Late' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              Đi muộn
                            </button>
                            <button
                              onClick={() => handleAttendanceChange(student?.id, 'Absent')}
                              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                status === 'Absent' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              Vắng mặt
                            </button>
                          </div>
                        </td>
                        <td className="p-4 px-6 text-gray-600 font-medium">
                          {record ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center space-x-1 text-xs bg-gray-100 px-2.5 py-1 rounded-md">
                                <Clock className="h-3 w-3 text-indigo-600" />
                                <span>Check-in: {record.check_in_time}</span>
                              </span>
                              {status === 'Late' && (
                                <p className="text-xs text-amber-600 font-bold">
                                  Trễ: {record.late_minutes || calculateLateMinutes(record.check_in_time, classStartTime)} phút
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Chưa điểm danh</span>
                          )}
                        </td>
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