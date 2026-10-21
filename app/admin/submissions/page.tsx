'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, CheckCircle, FileText, ExternalLink, Download } from 'lucide-react'

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    setLoading(true)
    // Lấy danh sách bài nộp kèm thông tin học sinh và bài tập
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        users:student_id (full_name, student_code),
        assignments:assignment_id (title)
      `)
      .order('created_at', { ascending: false })

    if (data) {
      setSubmissions(data)
    }
    setLoading(false)
  }

  const getFileUrl = (fileUrl: string) => {
    if (!fileUrl) return '#'
    if (fileUrl.startsWith('http')) return fileUrl
    const fileName = fileUrl.split('/').pop()?.split('?')[0] || ''
    const { data } = supabase.storage.from('assignments').getPublicUrl(fileName)
    return data.publicUrl
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Quản trị</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Bài nộp của Học sinh</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center space-x-2 text-gray-700">
            <FileText className="h-5 w-5 text-indigo-600" />
            <span className="font-bold">Danh sách các bài làm đã gửi lên hệ thống</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải danh sách bài nộp...</div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Chưa có học sinh nào nộp bài.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {submissions.map((sub) => {
                const subFileUrl = sub.file_url ? getFileUrl(sub.file_url) : null
                const subFileName = sub.file_url ? (sub.file_url.split('/').pop()?.split('?')[0] || '') : ''

                return (
                  <div key={sub.id} className="p-6 space-y-3 hover:bg-gray-50 transition">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900">{sub.users?.full_name || 'Học sinh'}</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold">
                            {sub.users?.student_code}
                          </span>
                        </div>
                        <p className="text-xs text-indigo-600 font-semibold">
                          Bài tập: {sub.assignments?.title || 'Không rõ tiêu đề'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-gray-500">
                          {new Date(sub.created_at).toLocaleString('vi-VN')}
                        </span>
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Đã nộp</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Nội dung bài làm: </span>
                        <span className="text-gray-600">{sub.content}</span>
                      </div>

                      {subFileUrl && (
                        <div className="pt-2 flex flex-wrap gap-2">
                          <a
                            href={subFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition shadow-sm border border-indigo-100"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>Xem trực tiếp tệp bài làm ({subFileName})</span>
                          </a>
                          <a
                            href={subFileUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition shadow-sm border border-gray-200"
                          >
                            <Download className="h-4 w-4" />
                            <span>Tải tệp xuống máy</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}