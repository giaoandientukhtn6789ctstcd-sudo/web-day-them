'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Plus, BookOpen, Calendar, FileUp, Trash2 } from 'lucide-react'

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setAssignments(data)
    setLoading(false)
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bài tập!')
      return
    }

    setUploading(true)
    let fileUrl = null

    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(filePath, file)

      if (uploadError) {
        console.warn('Lỗi storage:', uploadError.message)
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('assignments')
          .getPublicUrl(filePath)
        fileUrl = publicUrlData.publicUrl
      }
    }

    const { error } = await supabase.from('assignments').insert([
      {
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate || null,
        file_url: fileUrl || (file ? file.name : null),
      },
    ])

    setUploading(false)

    if (error) {
      alert('Lỗi tạo bài tập: ' + error.message)
    } else {
      setTitle('')
      setDescription('')
      setDueDate('')
      setFile(null)
      setIsModalOpen(false)
      fetchAssignments()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài tập này không?')) {
      await supabase.from('assignments').delete().eq('id', id)
      fetchAssignments()
    }
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition font-medium"
          >
            <Plus className="h-5 w-5" />
            <span>Giao bài tập mới</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center space-x-2 text-gray-700">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <span className="font-bold">Danh sách bài tập đã giao</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải danh sách bài tập...</div>
          ) : assignments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Chưa có bài tập nào được giao.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {assignments.map((item) => (
                <div key={item.id} className="p-6 flex justify-between items-start hover:bg-gray-50 transition">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description || 'Không có mô tả chi tiết.'}</p>
                    
                    {item.file_url && (
                      <div className="pt-1">
                        <a
                          href={item.file_url.startsWith('http') ? item.file_url : '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!item.file_url.startsWith('http')) {
                              e.preventDefault()
                              alert('Tệp đính kèm: ' + item.file_url)
                            }
                          }}
                          className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition"
                        >
                          <FileUp className="h-3.5 w-3.5" />
                          <span>Tệp đính kèm: {item.file_url.split('/').pop()}</span>
                        </a>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-indigo-600 font-medium pt-2">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Hạn nộp: {item.due_date ? new Date(item.due_date).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Xóa bài tập"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Tạo bài tập */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">Tạo bài tập mới kèm tài liệu</h2>
            
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề bài tập</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Bài tập Toán đại số chương 1..."
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả / Hướng dẫn chi tiết</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập yêu cầu bài tập cho học sinh..."
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đính kèm tệp (Ảnh, PDF, Word)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                <p className="text-xs text-gray-400 mt-1">Hỗ trợ các định dạng: PDF, Word (.doc, .docx), Hình ảnh (.png, .jpg)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hạn nộp bài</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-800"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
                >
                  {uploading ? 'Đang tải lên...' : 'Giao bài tập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}