'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, CheckCircle, FileText, ExternalLink, Download, RotateCw, Award, AlertCircle, Eye } from 'lucide-react'

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // State Modal toàn màn hình & xoay ảnh hỗ trợ nhiều ảnh
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [rotation, setRotation] = useState(0)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    setLoading(true)
    const { data } = await supabase
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

  const handleUpdateEvaluation = async (id: string, evaluation: string) => {
    const { error } = await supabase
      .from('submissions')
      .update({ evaluation })
      .eq('id', id)

    if (error) {
      alert('Lỗi cập nhật đánh giá: ' + error.message)
    } else {
      fetchSubmissions()
    }
  }

  const getFileUrl = (fileUrl: string) => {
    if (!fileUrl) return '#'
    if (fileUrl.startsWith('http')) return fileUrl
    const fileName = fileUrl.split('/').pop()?.split('?')[0] || ''
    const { data } = supabase.storage.from('assignments').getPublicUrl(fileName)
    return data.publicUrl
  }

  // Thống kê số liệu
  const totalSubmissions = submissions.length
  const countTot = submissions.filter(s => s.evaluation === 'TỐT').length
  const countKha = submissions.filter(s => s.evaluation === 'KHÁ').length
  const countDat = submissions.filter(s => s.evaluation === 'ĐẠT').length
  const countChuaDat = submissions.filter(s => s.evaluation === 'CHƯA ĐẠT').length

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

        {/* Bảng Thống kê Tổng quan */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-xs text-gray-500 font-medium">Tổng bài đã nộp</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{totalSubmissions}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-100 text-center">
            <p className="text-xs text-green-600 font-semibold">Tốt</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{countTot}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100 text-center">
            <p className="text-xs text-blue-600 font-semibold">Khá</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{countKha}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl shadow-sm border border-amber-100 text-center">
            <p className="text-xs text-amber-600 font-semibold">Đạt</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{countDat}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100 text-center col-span-2 md:col-span-1">
            <p className="text-xs text-red-600 font-semibold">Chưa đạt</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{countChuaDat}</p>
          </div>
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
                // Tách danh sách file nếu học sinh nộp nhiều file cách nhau bằng dấu phẩy
                const rawUrls = sub.file_url ? sub.file_url.split(',').map((u: string) => u.trim()).filter(Boolean) : []
                const fileUrls = rawUrls.map((u: string) => getFileUrl(u))

                return (
                  <div key={sub.id} className="p-6 space-y-4 hover:bg-gray-50 transition">
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

                    <div className="p-4 bg-gray-50 rounded-lg space-y-3 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Nội dung bài làm: </span>
                        <span className="text-gray-600">{sub.content}</span>
                      </div>

                      {fileUrls.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-2 items-center">
                          <button
                            onClick={() => {
                              setPreviewImages(fileUrls)
                              setCurrentImageIndex(0)
                              setRotation(0)
                            }}
                            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-sm cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Mở bộ sưu tập ảnh ({fileUrls.length} tệp) & Xoay chiều</span>
                          </button>

                          {fileUrls.map((url: string, idx: number) => (
                            <a
                              key={idx}
                              href={url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition shadow-sm border border-gray-200"
                            >
                              <Download className="h-4 w-4" />
                              <span>Tải ảnh {idx + 1}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Phần đánh giá và trạng thái nộp lại */}
                      <div className="pt-3 border-t border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-indigo-600" />
                          <span className="font-semibold text-xs text-gray-700">Đánh giá của giáo viên:</span>
                          <div className="flex space-x-1.5">
                            {['TỐT', 'KHÁ', 'ĐẠT', 'CHƯA ĐẠT'].map((evalOpt) => {
                              const isActive = sub.evaluation === evalOpt
                              let activeColor = 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              if (isActive) {
                                if (evalOpt === 'TỐT') activeColor = 'bg-green-600 text-white shadow'
                                else if (evalOpt === 'KHÁ') activeColor = 'bg-blue-600 text-white shadow'
                                else if (evalOpt === 'ĐẠT') activeColor = 'bg-amber-500 text-white shadow'
                                else if (evalOpt === 'CHƯA ĐẠT') activeColor = 'bg-red-600 text-white shadow'
                              }
                              return (
                                <button
                                  key={evalOpt}
                                  onClick={() => handleUpdateEvaluation(sub.id, evalOpt)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${activeColor}`}
                                >
                                  {evalOpt}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {sub.evaluation === 'CHƯA ĐẠT' && (
                          <div className="flex items-center space-x-1.5 text-red-600 text-xs font-semibold bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                            <AlertCircle className="h-4 w-4" />
                            <span>Học sinh cần nộp lại bài!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Toàn màn hình xem và xoay ảnh hiển thị vừa khít màn hình ban đầu */}
      {previewImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 overflow-hidden">
          {/* Thanh công cụ điều khiển phía trên */}
          <div className="w-full max-w-5xl flex items-center justify-between bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl text-white shadow-xl">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-bold">
                Ảnh {currentImageIndex + 1} / {previewImages.length}
              </span>
              {previewImages.length > 1 && (
                <div className="flex space-x-1.5">
                  {previewImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setCurrentImageIndex(idx); setRotation(0); }}
                      className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition ${currentImageIndex === idx ? 'bg-indigo-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow"
              >
                <RotateCw className="h-4 w-4" />
                <span>Xoay ảnh ({rotation}°)</span>
              </button>
              <button
                onClick={() => setPreviewImages([])}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>

          {/* Vùng xem ảnh hiển thị vừa khít màn hình, có thể cuộn và thu phóng */}
          <div className="flex-1 w-full flex items-center justify-center overflow-auto p-4">
            <div className="min-w-full min-h-full flex items-center justify-center">
              <img
                src={previewImages[currentImageIndex]}
                alt="Bài làm học sinh"
                style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.3s ease' }}
                className="max-w-full max-h-[80vh] w-auto h-auto object-contain shadow-2xl rounded-lg my-auto cursor-zoom-in"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}