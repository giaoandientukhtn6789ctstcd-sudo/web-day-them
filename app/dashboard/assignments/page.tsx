'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, BookOpen, Send, CheckCircle, ExternalLink, Download, FileUp, AlertCircle, Award, RefreshCw, X } from 'lucide-react'

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [answerFiles, setAnswerFiles] = useState<File[]>([])
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

    const { data: studentClasses } = await supabase
      .from('class_students')
      .select('class_id, classes:class_id (class_name)')
      .eq('student_id', userId)

    const myClassNames = studentClasses?.map((sc: any) => sc.classes?.class_name).filter(Boolean) || []

    const { data: assignData } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false })

    const filteredAssignments = assignData ? assignData.filter((item) => {
      if (!item.class_name || item.class_name === 'Tất cả các lớp' || item.class_name === 'all') {
        return true
      }
      return myClassNames.includes(item.class_name)
    }) : []

    const { data: subData } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', userId)

    if (filteredAssignments) {
      const combined = filteredAssignments.map((item) => {
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

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(file)
        return
      }

      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          const MAX_DIMENSION = 1200
          if (width > height && width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width)
            width = MAX_DIMENSION
          } else if (height > width && height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height)
            height = MAX_DIMENSION
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                resolve(file)
              }
            },
            'image/jpeg',
            0.8
          )
        }
      }
    })
  }

  const handleSubmitAssignment = async (assignmentId: string) => {
    if (!answerText.trim() && answerFiles.length === 0) {
      alert('Vui lòng nhập nội dung hoặc đính kèm tệp bài làm!')
      return
    }

    setSubmitting(true)
    let fileUrls: string[] = []

    try {
      const uploadPromises = answerFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `submission_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('assignments')
          .upload(fileName, file, { upsert: true })

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('assignments')
            .getPublicUrl(fileName)
          return publicUrlData.publicUrl
        }
        return null
      })

      const results = await Promise.all(uploadPromises)
      fileUrls = results.filter(Boolean) as string[]
    } catch (err) {
      console.error('Lỗi upload ảnh:', err)
    }

    const combinedFileUrl = fileUrls.length > 0 ? fileUrls.join(',') : null
    const existingSub = assignments.find(a => a.id === assignmentId)?.submission

    let error = null
    if (existingSub) {
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          content: answerText.trim() || 'Nộp bài đính kèm tệp',
          file_url: combinedFileUrl || existingSub.file_url,
          evaluation: null,
          created_at: new Date().toISOString()
        })
        .eq('id', existingSub.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from('submissions').insert([
        {
          assignment_id: assignmentId,
          student_id: user.id,
          content: answerText.trim() || 'Nộp bài đính kèm tệp',
          file_url: combinedFileUrl,
          status: 'submitted',
        },
      ])
      error = insertError
    }

    setSubmitting(false)

    if (error) {
      alert('Lỗi khi nộp bài: ' + error.message)
    } else {
      setAnswerText('')
      setAnswerFiles([])
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

  // Hàm tạo link xem trực tiếp thông minh (Hỗ trợ PDF, Ảnh xem trực tiếp, Word qua Google Docs Viewer)
  const getViewingUrl = (rawUrl: string) => {
    const url = getFileUrl(rawUrl)
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.endsWith('.doc') || lowerUrl.endsWith('.docx')) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`
    }
    return url
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 transition cursor-pointer"
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
            <div className="p-8 text-center text-gray-500">Chưa có bài tập nào được giao cho lớp của bạn.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {assignments.map((item) => {
                const finalUrl = getFileUrl(item.file_url)
                const viewingUrl = getViewingUrl(item.file_url)
                const fileName = item.file_url ? (item.file_url.split('/').pop()?.split('?')[0] || '') : ''
                
                const subFileUrls = item.submission?.file_url 
                  ? item.submission.file_url.split(',').map((u: string) => getFileUrl(u.trim())).filter(Boolean) 
                  : []

                const evaluation = item.submission?.evaluation

                return (
                  <div key={item.id} className="p-6 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                          <span className="text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-semibold">
                            {item.class_name || 'Tất cả các lớp'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{item.description || 'Không có mô tả chi tiết.'}</p>
                        
                        {item.file_url && (
                          <div className="pt-1 flex flex-wrap gap-2">
                            <a
                              href={viewingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition shadow-sm border border-blue-100 cursor-pointer"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>Xem trực tiếp / Đọc đề ({fileName})</span>
                            </a>
                            <a
                              href={finalUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition shadow-sm border border-gray-200 cursor-pointer"
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

                    {item.submission && (
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-3 text-xs text-gray-600 border border-gray-200">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                          <div>
                            <span className="font-semibold text-gray-700">Nội dung bài làm của bạn: </span>
                            {item.submission.content}
                          </div>
                          {evaluation && (
                            <div className="flex items-center space-x-1 px-3 py-1 rounded-lg font-bold text-xs shadow-sm"
                              style={{
                                backgroundColor: evaluation === 'TỐT' ? '#dcfce7' : evaluation === 'KHÁ' ? '#dbeafe' : evaluation === 'ĐẠT' ? '#fef3c7' : '#fee2e2',
                                color: evaluation === 'TỐT' ? '#166534' : evaluation === 'KHÁ' ? '#1e40af' : evaluation === 'ĐẠT' ? '#92400e' : '#991b1b'
                              }}
                            >
                              <Award className="h-4 w-4" />
                              <span>Đánh giá: {evaluation}</span>
                            </div>
                          )}
                        </div>

                        {subFileUrls.length > 0 && (
                          <div className="space-y-1">
                            <span className="font-semibold text-gray-700">Tệp đính kèm bài làm ({subFileUrls.length} ảnh/tệp): </span>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {subFileUrls.map((url: string, idx: number) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline font-medium inline-flex items-center space-x-1 bg-white px-2.5 py-1 rounded border shadow-xs"
                                >
                                  <FileUp className="h-3.5 w-3.5 inline" />
                                  <span>Ảnh {idx + 1}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {evaluation === 'CHƯA ĐẠT' && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold flex items-center space-x-2">
                            <span>Bài làm bị đánh giá <b>CHƯA ĐẠT</b>. Vui lòng bấm <b>Nộp lại bài</b> bên dưới để hoàn thiện lại bài tập!</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {submittingId === item.id ? (
                        <div className="space-y-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                          <h4 className="font-bold text-blue-900 text-sm">
                            {item.submission ? 'Nộp lại bài tập mới' : 'Nộp bài tập'}
                          </h4>
                          <textarea
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            placeholder="Nhập nội dung câu trả lời cho bài làm..."
                            rows={3}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 text-sm bg-white"
                          />
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Đính kèm nhiều ảnh (Tự động nén nhanh & cộng dồn)</label>
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                              onChange={async (e) => {
                                if (e.target.files) {
                                  const rawFiles = Array.from(e.target.files)
                                  setSubmitting(true)
                                  
                                  const compressedFiles = await Promise.all(
                                    rawFiles.map((file) => compressImage(file))
                                  )

                                  setAnswerFiles((prev) => [...prev, ...compressedFiles])
                                  setSubmitting(false)
                                  e.target.value = ''
                                }
                              }}
                              className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                            />
                            
                            {answerFiles.length > 0 && (
                              <div className="mt-2 space-y-1.5 bg-white p-3 rounded-lg border">
                                <p className="text-xs font-bold text-blue-700">Đã chọn tổng cộng {answerFiles.length} tệp tin:</p>
                                {answerFiles.map((f, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1 rounded">
                                    <span className="truncate max-w-[260px] text-gray-700"> - {f.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAnswerFiles((prev) => prev.filter((_, idx) => idx !== i))
                                      }}
                                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer font-bold"
                                      title="Xóa ảnh này"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex justify-end space-x-2 pt-2">
                            <button
                              onClick={() => {
                                setSubmittingId(null)
                                setAnswerFiles([])
                              }}
                              className="px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-100 text-sm font-medium bg-white cursor-pointer"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleSubmitAssignment(item.id)}
                              disabled={submitting}
                              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex items-center space-x-1 shadow cursor-pointer"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>{submitting ? 'Đang nén & gửi...' : 'Xác nhận gửi bài'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSubmittingId(item.id)
                            setAnswerText(item.submission?.content || '')
                            setAnswerFiles([])
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition inline-flex items-center space-x-1.5 cursor-pointer ${
                            item.submission?.evaluation === 'CHƯA ĐẠT'
                              ? 'bg-red-600 hover:bg-red-700 text-white shadow'
                              : item.submission
                              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow'
                          }`}
                        >
                          {item.submission ? (
                            <>
                              <RefreshCw className="h-4 w-4" />
                              <span>Nộp lại bài tập</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              <span>Nộp bài tập này</span>
                            </>
                          )}
                        </button>
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