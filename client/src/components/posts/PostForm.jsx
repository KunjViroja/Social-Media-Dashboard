import React, { useState } from 'react'
import { FiImage, FiSend, FiLoader } from 'react-icons/fi'
import Avatar from '../common/Avatar'
import useAuth from '../../hooks/useAuth'
import postService from '../../services/post.service'
import toast from 'react-hot-toast'

export default function PostForm({ onPostCreated }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleMediaChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setMediaFile(file)
      setMediaPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() && !mediaFile) return

    setLoading(true)
    const formData = new FormData()
    formData.append('content', content)
    if (mediaFile) {
      formData.append('media', mediaFile)
    }

    try {
      const res = await postService.createPost(formData)
      toast.success('Post created successfully!')
      setContent('')
      setMediaFile(null)
      setMediaPreview(null)
      if (onPostCreated) onPostCreated(res.data.post)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-dark rounded-2xl p-5 mb-6 border border-white/5">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3 items-start">
          <Avatar user={user} size="sm" />
          <div className="flex-1">
            <textarea
              placeholder="What's happening?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent border-none outline-none resize-none text-white text-sm placeholder-dark-400 min-h-[80px]"
            />

            {mediaPreview && (
              <div className="relative rounded-xl overflow-hidden border border-white/5 mb-4 max-h-60 bg-dark-950">
                <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setMediaFile(null)
                    setMediaPreview(null)
                  }}
                  className="absolute top-2 right-2 p-1 bg-dark-900/80 hover:bg-dark-900 rounded-full text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <label className="flex items-center gap-2 text-dark-300 hover:text-white cursor-pointer transition-colors text-sm">
                <FiImage size={18} className="text-primary-400" />
                <span>Media</span>
                <input type="file" onChange={handleMediaChange} className="hidden" accept="image/*,video/*" />
              </label>

              <button
                type="submit"
                disabled={loading || (!content.trim() && !mediaFile)}
                className="btn-primary flex items-center gap-2 !px-4 !py-2 disabled:opacity-50"
              >
                {loading ? <FiLoader className="animate-spin" size={16} /> : <FiSend size={16} />}
                <span>Post</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
