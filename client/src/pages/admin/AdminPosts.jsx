import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiFileText, FiTrash2, FiFlag, FiLoader } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import api from '../../services/api'
import Avatar from '../../components/common/Avatar'
import toast from 'react-hot-toast'

export default function AdminPosts() {
  const [posts,      setPosts]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [page,       setPage]       = useState(1)
  const [pagination, setPagination] = useState({})
  const [flagged,    setFlagged]    = useState(false)

  const fetchPosts = async (pg = 1) => {
    setLoading(true)
    try {
      const params = { page: pg, limit: 20 }
      if (flagged) params.flagged = 'true'
      const res = await api.get('/admin/posts', { params })
      setPosts(res.posts || [])
      setPagination(res.pagination || {})
    } catch {
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts(page)
  }, [page, flagged])

  const handleDelete = async (postId) => {
    if (!window.confirm('Remove this post from the platform?')) return
    try {
      await api.delete(`/admin/posts/${postId}`)
      toast.success('Post removed')
      setPosts((prev) => prev.filter((p) => p._id !== postId))
    } catch {
      toast.error('Failed to remove post')
    }
  }

  const handleFlag = async (postId) => {
    try {
      await api.put(`/admin/posts/${postId}/flag`, { reason: 'Violates community guidelines' })
      toast.success('Post flagged for review')
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, isFlagged: true } : p))
      )
    } catch {
      toast.error('Failed to flag post')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-accent-pink/10 flex items-center justify-center">
            <FiFileText className="text-accent-pink" size={18} />
          </div>
          <h1 className="text-2xl font-bold text-white">Post Moderation</h1>
        </div>
        <p className="text-dark-400 text-sm">
          Review and moderate platform content — {pagination.total || 0} posts
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setFlagged(false); setPage(1) }}
          className={`btn-ghost !px-4 !py-2 text-sm ${!flagged ? '!border-primary-500/40 text-primary-300 bg-primary-500/10' : ''}`}
        >
          All Posts
        </button>
        <button
          onClick={() => { setFlagged(true); setPage(1) }}
          className={`btn-ghost !px-4 !py-2 text-sm flex items-center gap-1.5 ${flagged ? '!border-accent-amber/40 text-accent-amber bg-accent-amber/10' : ''}`}
        >
          <FiFlag size={13} /> Flagged
        </button>
      </div>

      {/* Posts table */}
      <div className="glass-dark rounded-3xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <FiLoader size={28} className="text-primary-400 animate-spin mx-auto mb-3" />
            <p className="text-dark-400 text-sm">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-16 text-center text-dark-400">No posts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-dark-300 font-semibold uppercase text-xs tracking-wider">
                  <th className="p-4">Author</th>
                  <th className="p-4">Content</th>
                  <th className="p-4">Stats</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts.map((post) => (
                  <motion.tr
                    key={post._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Avatar user={post.author} size="xs" />
                        <div>
                          <p className="text-white text-xs font-medium">
                            {post.author?.fullName || post.author?.username}
                          </p>
                          <p className="text-dark-400 text-xs">@{post.author?.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-white/80 text-xs line-clamp-2">{post.content || '(media only)'}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-white text-xs">
                        ❤️ {post.likesCount || 0} &nbsp; 💬 {post.commentsCount || 0}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-dark-400 text-xs whitespace-nowrap">
                        {post.createdAt
                          ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
                          : '—'}
                      </p>
                    </td>
                    <td className="p-4">
                      {post.isFlagged ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-amber/10 text-accent-amber">
                          Flagged
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-accent-green">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {!post.isFlagged && (
                          <button
                            onClick={() => handleFlag(post._id)}
                            title="Flag post"
                            className="p-1.5 rounded-lg hover:bg-accent-amber/10 text-dark-400 hover:text-accent-amber transition-colors"
                          >
                            <FiFlag size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(post._id)}
                          title="Remove post"
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-dark-400 hover:text-accent-red transition-colors"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-dark-400 text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost !px-4 !py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="btn-ghost !px-4 !py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
