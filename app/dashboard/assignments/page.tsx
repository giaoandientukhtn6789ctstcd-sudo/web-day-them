'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, BookOpen, Send, CheckCircle, ExternalLink, Download, FileUp } from 'lucide-react'

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [answerFile, setAnswerFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (!storedUser) {
      router.push('/login')
    } else {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      fetchAssignments(parsedUser.id)
    }
  }, [router])

  const fetchAssignments = async (userId: string) => {
    setLoading(true)
    const { data: assignData } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: subData } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', userId)

    if (assignData) {
      const combined = assignData.map((item) => {
        const sub = subData?.find((s) => s.assignment_id === item.id)
        return {
          ...item,
          submission: sub || null,
        }
      })
      setAssignments(combined)
    }
    setLoading(false)
  }

  const handleSubmitAssignment = async (assignmentId: string) => {
    if (!answerText.trim() && !answerFile) {
      alert('Vui lòng nhập nội dung hoặc đính kèm tệp bài làm!')
      return
    }

    setSubmitting(true)
    let fileUrl = null

    if (answerFile) {
      const fileExt = answerFile.name.split('.').pop()
      const fileName = `submission_${user.id}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(fileName, answerFile, { upsert: true })

      if (uploadError) {
        alert('Lỗi tải tệp lên: ' + uploadError.message)
        setSubmitting(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('assignments')
        .getPublicUrl(fileName)

      fileUrl = publicUrlData.publicUrl
    }

    const { error } = await supabase.from('submissions').insert([
      {
        assignment_id: assignmentId,
        student_id: user.id,
        content: answerText.trim() || 'Nộp bài đính kèm tệp',
        file_url: fileUrl,
        status: 'submitted',
      },
    ])

    setSubmitting(false)

    if (error) {
      alert('Lỗi khi nộp bài: ' + error.message)
    } else {
      setAnswerText('')
      setAnswerFile(null)
      setSubmittingId(null)
      fetchAssignments(user.id)
    }
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
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Trang chủ</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Bài tập của tôi</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center space-x-2 text-gray-700">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span className="font-bold">Danh sách bài tập cần hoàn thành</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải danh sách bài tập...</div>
          ) : assignments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Chưa có bài tập nào được giao.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {assignments.map((item) => {
                const finalUrl = getFileUrl(item.file_url)
                const fileName = item.file_url ? (item.file_url.split('/').pop()?.split('?')[0] || '') : ''
                const subFileUrl = item.submission?.file_url ? getFileUrl(item.submission.file_url) : null
                const subFileName = item.submission?.file_url ? (item.submission.file_url.split('/').pop()?.split('?')[0] || '') : ''

                return (
                  <div key={item.id} className="p-6 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-600">{item.description || 'Không có mô tả chi tiết.'}</p>
                        
                        {item.file_url && (
                          <div className="pt-1 flex flex-wrap gap-2">
                            <a
                              href={finalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition shadow-sm border border-blue-100"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>Xem trực tiếp / Đọc đề ({fileName})</span>
                            </a>
                            <a
                              href={finalUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition shadow-sm border border-gray-200"
                            >
                              <Download className="h-4 w-4" />
                              <span>Tải xuống máy</span>
                            </a>
                          </div>
                        )}

                        <p className="text-xs text-blue-600 font-medium pt-1">
                          Hạn nộp: {item.due_date ? new Date(item.due_date).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                        </p>
                      </div>

                      <div>
                        {item.submission ? (
                          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Đã nộp bài</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-semibold">
                            <span>Chưa nộp</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {!item.submission && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {submittingId === item.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={answerText}
                              onChange={(e) => setAnswerText(e.target.value)}
                              placeholder="Nhập nội dung câu trả lời cho bài làm..."
                              rows={3}
                              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 text-sm"
                            />
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Đính kèm ảnh / tài liệu bài làm</label>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                onChange={(e) => setAnswerFile(e.target.files ? e.target.files[0] : null)}
                                className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                              />
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                              <button
                                onClick={() => setSubmittingId(null)}
                                className="px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={() => handleSubmitAssignment(item.id)}
                                disabled={submitting}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex items-center space-x-1"
                              >
                                <Send className="h-3.5 w-3.5" />
                                <span>{submitting ? 'Đang gửi...' : 'Gửi bài nộp'}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSubmittingId(item.id)
                              setAnswerText('')
                              setAnswerFile(null)
                            }}
                            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition"
                          >
                            Nộp bài tập này
                          </button>
                        )}
                      </div>
                    )}

                    {item.submission && (
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-2 text-xs text-gray-600">
                        <div>
                          <span className="font-semibold text-gray-700">Nội dung bài làm: </span>
                          {item.submission.content}
                        </div>
                        {subFileUrl && (
                          <div>
                            <span className="font-semibold text-gray-700">Tệp đính kèm bài làm: </span>
                            <a
                              href={subFileUrl}
                            target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium inline-flex items-center space-x-1 ml-1"
                            >
                              <FileUp className="h-3.5 w-3.5 inline" />
                              <span>{subFileName}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    )}
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