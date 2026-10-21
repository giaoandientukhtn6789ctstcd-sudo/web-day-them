'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Trophy, Medal, Award } from 'lucide-react'

export default function LeaderboardPage() {
  const [ranking, setRanking] = useState<any[]>([])
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('student')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      setUserRole(parsed.role)
    }
    checkAndFetch()
  }, [])

  const checkAndFetch = async () => {
    setLoading(true)
    const { data: setting } = await supabase.from('system_settings').select('*').eq('key', 'leaderboard_public').single()
    if (setting && setting.value === 'false') {
      setIsPublic(false)
      setLoading(false)
      return
    }

    const { data: students } = await supabase.from('users').select('*').eq('role', 'student')
    const { data: submissions } = await supabase.from('submissions').select('student_id')

    if (students && submissions) {
      const scored = students.map((st) => {
        const count = submissions.filter((sub) => sub.student_id === st.id).length
        return {
          ...st,
          completedCount: count,
        }
      })
      scored.sort((a, b) => b.completedCount - a.completedCount)
      setRanking(scored)
    }
    setLoading(false)
  }

  const handleGoBack = () => {
    if (userRole === 'admin' || userRole === 'assistant') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Trang chủ</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Bảng Xếp Hạng Học Tập</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center space-x-2 text-gray-700">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span className="font-bold">Top học sinh tích cực nhất lớp</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải bảng xếp hạng...</div>
          ) : !isPublic && userRole === 'student' ? (
            <div className="p-12 text-center text-gray-500 space-y-2">
              <Trophy className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="font-semibold">Bảng xếp hạng hiện đang tạm ẩn theo cài đặt của Giáo viên.</p>
            </div>
          ) : ranking.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Chưa có dữ liệu học tập.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {ranking.map((item, index) => (
                <div key={item.id} className="p-4 px-6 flex justify-between items-center hover:bg-gray-50 transition">
                  <div className="flex items-center space-x-4">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {index === 0 ? <Trophy className="h-5 w-5" /> : index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.full_name}</h4>
                      <p className="text-xs text-indigo-600 font-semibold">Mã: {item.student_code}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                    <Award className="h-4 w-4" />
                    <span>{item.completedCount} bài đã hoàn thành</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}