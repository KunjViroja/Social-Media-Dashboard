import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSend, FiLoader, FiTrash2 } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import api from '../../services/api'
import useAuth from '../../hooks/useAuth'
import Avatar from '../common/Avatar'
import toast from 'react-hot-toast'

export default function CommentSection({ postId, commentsCount, onCountChange }) {
  const { user }            = useAuth()
  const [comments, setComments] = useState([])
  const [text,     setText]     = useState('')
  const [loading,  setLoading]  = useState(true)
  const [sending,  setSending]  = useState(false)

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await api.get(`/comments/${postId}`)
        setComments(res.comments || [])
      } catch {}
      finally { setLoading(false) }
    }
    fetchComments()
  }, [postId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await api.post(`/comments/${postId}`, { content: text.trim() })
      const newComment = res.comment || res.data?.comment
      if (newComment) {
        setComments((prev) => [newComment, ...prev])
        onCountChange?.((prev) => prev + 1)
      }
      setText('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`)
      setComments((prev) => prev.filter((c) => c._id !== commentId))
      onCountChange?.((prev) => Math.max(0, prev - 1))
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="border-t border-white/5 mt-3 pt-4 space-y-4 overflow-hidden"
    >
      {/* Comment form */}
      <form onSubmit={handleSubmit} className="flex items-start gap-3">
        <Avatar user={user} size="xs" />
        <div className="flex-1 flex items-center gap-2 bg-white/4 border border-white/8 rounded-xl px-3 py-2">
          <input
            type="text"
            placeholder="Write a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-transparent outline-none text-white text-sm placeholder-dark-400"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="text-primary-400 hover:text-primary-300 disabled:opacity-40 transition-colors shrink-0"
          >
            {sending ? <FiLoader size={15} className="animate-spin" /> : <FiSend size={15} />}
          </button>
        </div>
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-12 skeleton rounded-xl" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-dark-500 text-sm text-center py-2">
          No comments yet. Be the first!
        </p>
      ) : (
        <AnimatePresence initial={false}>
          {comments.map((comment) => (
            <motion.div
              key={comment._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-start gap-3 group"
            >
              <Link to={`/profile/${comment.author?.username}`} className="shrink-0">
                <Avatar user={comment.author} size="xs" />
              </Link>
              <div className="flex-1 min-w-0 bg-white/4 border border-white/5 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <Link
                    to={`/profile/${comment.author?.username}`}
                    className="text-white text-xs font-semibold hover:underline truncate"
                  >
                    {comment.author?.fullName || comment.author?.username}
                  </Link>
                  <span className="text-dark-500 text-xs shrink-0">
                    {comment.createdAt
                      ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
                      : ''}
                  </span>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">{comment.content}</p>
              </div>
              {user?._id === comment.author?._id && (
                <button
                  onClick={() => handleDelete(comment._id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-dark-400 hover:text-accent-red rounded-lg hover:bg-white/5"
                >
                  <FiTrash2 size={13} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </motion.div>
  )
}
