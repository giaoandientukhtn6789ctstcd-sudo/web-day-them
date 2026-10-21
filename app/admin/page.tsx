'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Users, BookOpen, FileText, CheckSquare, Settings, Trophy, LogOut, Lock, Calendar, MessageSquare } from 'lucide-react'

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (!storedUser) {
      router.push('/login')
    } else {
      const parsed = JSON.parse(storedUser)
      if (parsed.role !== 'admin' && parsed.role !== 'assistant') {
        router.push('/dashboard')
      } else {
        setAdminUser(parsed)
      }
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    router.push('/login')
  }

  const isAssistant = adminUser?.role === 'assistant'
  const canManageStudents = isAssistant ? adminUser?.permissions?.canManageStudents : true

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{adminUser?.full_name || 'Quản trị viên'}</h1>
              <p className="text-xs text-indigo-600 font-semibold">
                QUYỀN HẠN: {adminUser?.role === 'admin' ? 'ADMIN / GIÁO VIÊN' : 'TRỢ GIẢNG (TA)'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-semibold transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </button>
        </div>

        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-2xl text-white shadow-md space-y-2">
          <h2 className="text-2xl font-bold">Bảng điều khiển Quản trị hệ thống</h2>
          <p className="text-sm text-indigo-100">
            {isAssistant 
              ? 'Chào trợ giảng! Bạn có thể quản lý lớp học, điểm danh, giao bài tập và chấm bài nộp của học sinh.' 
              : 'Quản lý tài khoản, lớp học, điểm danh, giao bài tập, cấu hình năm học mới và theo dõi bài nộp tại đây.'}
          </p>
        </div>

        {/* Grid các chức năng quản trị */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quản lý Lớp học & TKB */}
          <div
            onClick={() => window.location.href = '/admin/classes'}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer space-y-4 group"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Lớp học</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Quản lý Lớp học & TKB</h3>
              <p className="text-xs text-gray-500 mt-1">Tạo lớp theo khối/môn, cấu hình thời khóa biểu và thêm học sinh vào lớp.</p>
            </div>
          </div>

          {/* Quản lý tài khoản */}
          <div
            onClick={() => {
              if (!canManageStudents) {
                alert('Tài khoản Trợ giảng của bạn không được phân quyền Quản lý tài khoản!')
                return
              }
              window.location.href = '/admin/students'
            }}
            className={`bg-white p-6 rounded-2xl shadow-sm border transition cursor-pointer space-y-4 group ${
              !canManageStudents ? 'opacity-60 bg-gray-50 border-gray-200' : 'border-gray-100 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition ${!canManageStudents ? 'bg-gray-200 text-gray-500' : 'bg-blue-50 text-blue-600 group-hover:scale-110'}`}>
                {canManageStudents ? <Users className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${!canManageStudents ? 'bg-gray-200 text-gray-600' : 'text-blue-600 bg-blue-50'}`}>
                {canManageStudents ? 'Quản lý' : 'Đã khóa'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Quản lý Tài khoản</h3>
              <p className="text-xs text-gray-500 mt-1">
                {canManageStudents ? 'Thêm, sửa, xóa tài khoản Học sinh, Trợ giảng, ADMIN và đổi mật khẩu.' : 'Tính năng này đã bị khóa đối với tài khoản trợ giảng của bạn.'}
              </p>
            </div>
          </div>

          {/* Giao bài tập */}
          <div
            onClick={() => window.location.href = '/admin/assignments'}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer space-y-4 group"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">Bài tập</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Giao bài tập & Tệp đề</h3>
              <p className="text-xs text-gray-500 mt-1">Tạo bài tập mới, đính kèm tệp tài liệu/ảnh đề bài cho học sinh.</p>
            </div>
          </div>

          {/* Quản lý bài nộp */}
          <div
            onClick={() => window.location.href = '/admin/submissions'}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer space-y-4 group"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Bài làm</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Quản lý Bài nộp</h3>
              <p className="text-xs text-gray-500 mt-1">Xem trực tiếp, chấm điểm và tải tệp bài làm do học sinh gửi lên.</p>
            </div>
          </div>

          {/* Điểm danh */}
          <div
            onClick={() => window.location.href = '/admin/attendance'}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer space-y-4 group"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                <CheckSquare className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">Điểm danh</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Điểm danh Lớp học</h3>
              <p className="text-xs text-gray-500 mt-1">Điểm danh 1 chạm, tự động ghi nhận thời gian check-in của học sinh.</p>
            </div>
          </div>

          {/* Gửi Dặn dò Học sinh */}
          <div
            onClick={() => window.location.href = '/admin/notifications'}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer space-y-4 group"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                <MessageSquare className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Dặn dò</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Gửi Dặn dò Học sinh</h3>
              <p className="text-xs text-gray-500 mt-1">Gửi tin nhắn, lời dặn dò hoặc nhắc nhở học tập đến cá nhân hoặc cả lớp.</p>
            </div>
          </div>

          {/* Bảng xếp hạng */}
          <div
            onClick={() => window.location.href = '/dashboard/leaderboard'}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer space-y-4 group"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                <Trophy className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">Xếp hạng</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Xem Bảng Xếp Hạng</h3>
              <p className="text-xs text-gray-500 mt-1">Xem danh sách top học sinh hoàn thành nhiều bài tập nhất lớp.</p>
            </div>
          </div>

          {/* Cấu hình hệ thống */}
          <div
            onClick={() => {
              if (isAssistant) {
                alert('Tính năng Cấu hình hệ thống & Năm học mới chỉ dành riêng cho quyền ADMIN!')
                return
              }
              window.location.href = '/admin/settings'
            }}
            className={`bg-white p-6 rounded-2xl shadow-sm border transition cursor-pointer space-y-4 group ${
              isAssistant ? 'opacity-60 bg-gray-50 border-gray-200' : 'border-gray-100 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition ${isAssistant ? 'bg-gray-200 text-gray-500' : 'bg-red-50 text-red-600 group-hover:scale-110'}`}>
                {isAssistant ? <Lock className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isAssistant ? 'bg-gray-200 text-gray-600' : 'text-red-600 bg-red-50'}`}>
                {isAssistant ? 'Chỉ Admin' : 'Cài đặt'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Cấu hình & Năm học mới</h3>
              <p className="text-xs text-gray-500 mt-1">
                {isAssistant ? 'Đã khóa đối với trợ giảng. Chỉ tài khoản ADMIN mới được phép truy cập.' : 'Bật/tắt công khai bảng xếp hạng và làm sạch dữ liệu năm học mới.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}