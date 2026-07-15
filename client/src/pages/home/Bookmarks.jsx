import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FiBookmark } from 'react-icons/fi'
import postService from '../../services/post.service'
import PostCard from '../../components/posts/PostCard'
import toast from 'react-hot-toast'

export default function Bookmarks() {
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const res = await postService.getBookmarks({ page: 1, limit: 20 })
        setPosts(res.posts || [])
      } catch {
        toast.error('Failed to load bookmarks')
      } finally {
        setLoading(false)
      }
    }
    fetchBookmarks()
  }, [])

  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-white">Bookmarks</h1>
        <p className="text-dark-400 text-sm mt-0.5">Posts you've saved for later</p>
      </div>

      {/* Skeletons */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-dark rounded-2xl p-5 h-48 skeleton" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-3xl p-16 border border-white/5 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-accent-amber/10 flex items-center justify-center mx-auto mb-4">
            <FiBookmark size={28} className="text-accent-amber" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">No bookmarks yet</h3>
          <p className="text-dark-400 text-sm">
            Tap the bookmark icon on any post to save it here for later.
          </p>
        </motion.div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post, i) => (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <PostCard post={post} onDelete={handleDelete} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
