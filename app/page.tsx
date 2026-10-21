'use client'

import { useRouter } from 'next/navigation'
import { Phone, BookOpen, Award, Sparkles, GraduationCap, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50 to-white flex flex-col justify-between">
      {/* Header trên cùng */}
      <header className="max-w-6xl mx-auto w-full p-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-red-500 p-2.5 rounded-2xl text-white shadow-md">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="font-black text-xl text-red-600 tracking-wider">THĂNG TIẾN EDU</span>
        </div>
        <div className="space-x-3">
          <button
            onClick={() => router.push('/login')}
            className="px-5 py-2.5 text-sm font-bold text-red-600 bg-white hover:bg-red-50 border-2 border-red-200 rounded-2xl shadow-sm transition"
          >
            Đăng nhập hệ thống
          </button>
        </div>
      </header>

      {/* Nội dung chính giữa trang */}
      <main className="max-w-4xl mx-auto px-6 py-8 text-center space-y-8">
        {/* Huy hiệu dễ thương */}
        <div className="inline-flex items-center space-x-2 px-5 py-2 bg-yellow-200 text-yellow-900 rounded-full text-sm font-extrabold shadow-inner animate-bounce">
          <Sparkles className="h-5 w-5 text-red-500" />
          <span>Uy tín - Tận tâm - Tiến bộ từng ngày</span>
        </div>

        {/* Tiêu đề chính giống hệt tờ rơi nhưng thiết kế sang trọng, hiện đại */}
        <div className="space-y-3 bg-white p-8 rounded-3xl shadow-xl border-4 border-yellow-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl shadow-sm">
            Tuyển sinh 2026
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-red-600 tracking-tight uppercase drop-shadow-sm">
            LỚP HỌC THÊM THĂNG TIẾN
          </h1>
          
          <div className="inline-block px-6 py-2 bg-blue-600 text-white font-extrabold text-xl md:text-2xl rounded-2xl shadow-md uppercase tracking-wide">
            Nhận dạy kèm Toán – KHTN – Anh
          </div>

          <p className="text-xl md:text-2xl font-bold text-gray-800 pt-2">
            📚 Từ lớp 6 đến lớp 9
          </p>

          <div className="pt-2 text-lg font-extrabold text-red-500 italic">
            "Xây lại căn bản – Học chắc từ đầu"
          </div>
        </div>

        {/* Phần đặc biệt / Điểm nổi bật */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-blue-100 flex items-start space-x-4 hover:border-blue-300 transition">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-xl shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Lớp Anh văn thiếu nhi</h3>
              <p className="text-sm text-gray-600 mt-1">Chương trình tương tác vui nhộn, phát âm chuẩn và phản xạ tự nhiên.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-red-100 flex items-start space-x-4 hover:border-red-300 transition">
            <div className="bg-red-100 text-red-600 p-3 rounded-xl shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Chuyên kèm học sinh mất căn bản</h3>
              <p className="text-sm text-gray-600 mt-1">Lộ trình riêng biệt, kiên trì kèm cặp giúp học sinh lấy lại gốc nhanh chóng.</p>
            </div>
          </div>
        </div>

        {/* Khung số điện thoại liên hệ cực kỳ nổi bật */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-left">
            <div className="bg-white text-red-500 p-3.5 rounded-2xl shadow-inner">
              <Phone className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold opacity-90">Tư vấn & Ghi danh trực tiếp</p>
              <p className="text-2xl md:text-3xl font-black">0938274084</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full md:w-auto px-8 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-2xl font-black text-base shadow-md transition transform hover:scale-105"
          >
            Vào Không Gian Học Tập 🚀
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-500 font-medium">
        © 2026 Lớp Học Thêm Thăng Tiến. Hotline: 0938274084.
      </footer>
    </div>
  )
}