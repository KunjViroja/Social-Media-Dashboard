import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiHeart, FiMessageCircle, FiBookmark, FiShare2, FiTrash2 } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import Avatar from '../common/Avatar'
import CommentSection from './CommentSection'
import useAuth from '../../hooks/useAuth'
import postService from '../../services/post.service'
import toast from 'react-hot-toast'

export default function PostCard({ post, onDelete }) {
  const { user }                      = useAuth()
  const [liked,         setLiked]     = useState(post.isLiked    || false)
  const [likesCount,    setLikesCount]= useState(post.likesCount  || 0)
  const [bookmarked,    setBookmarked]= useState(post.isBookmarked|| false)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0)
  const [showComments,  setShowComments]  = useState(false)

  const handleLike = async () => {
    // Optimistic update
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikesCount((c) => wasLiked ? c - 1 : c + 1)
    try {
      const res = await postService.toggleLike(post._id)
      setLiked(res.data?.isLiked ?? !wasLiked)
      setLikesCount(res.data?.likesCount ?? (wasLiked ? likesCount - 1 : likesCount + 1))
    } catch {
      // Revert on error
      setLiked(wasLiked)
      setLikesCount((c) => wasLiked ? c + 1 : c - 1)
      toast.error('Failed to like post')
    }
  }

  const handleBookmark = async () => {
    try {
      const res = await postService.toggleBookmark(post._id)
      setBookmarked(res.data?.isBookmarked ?? !bookmarked)
      toast.success(res.data?.isBookmarked ? 'Post bookmarked' : 'Bookmark removed')
    } catch {
      toast.error('Failed to bookmark post')
    }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/profile/${post.author?.username}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard!')
    }).catch(() => {
      toast.error('Could not copy link')
    })
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-dark rounded-2xl p-5 mb-4 border border-white/5 hover:border-white/10 transition-all duration-200"
    >
      {/* Author row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.author?.username}`}>
            <Avatar user={post.author} size="sm" />
          </Link>
          <div>
            <Link
              to={`/profile/${post.author?.username}`}
              className="font-semibold text-white hover:underline block text-sm"
            >
              {post.author?.fullName || post.author?.username}
            </Link>
            <span className="text-xs text-dark-400">
              {post.createdAt
                ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
                : ''}
            </span>
          </div>
        </div>
        {user && post.author?._id === user._id && (
          <button
            onClick={() => onDelete(post._id)}
            className="text-dark-400 hover:text-accent-red p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <FiTrash2 size={16} />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="text-white/90 text-sm whitespace-pre-wrap mb-4 leading-relaxed">
        {post.content}
      </p>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-white/5 mb-4 max-h-96">
          {post.media[0].type === 'video' ? (
            <video src={post.media[0].url} controls className="w-full h-full object-cover" />
          ) : (
            <img
              src={post.media[0].url}
              alt="Post attachment"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between border-t border-white/5 pt-3">
        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-xs transition-colors group ${
            liked ? 'text-accent-pink' : 'text-dark-300 hover:text-accent-pink'
          }`}
        >
          <motion.div whileTap={{ scale: 1.3 }}>
            <FiHeart size={18} fill={liked ? 'currentColor' : 'none'} />
          </motion.div>
          <span>{likesCount}</span>
        </button>

        {/* Comment toggle */}
        <button
          onClick={() => setShowComments((v) => !v)}
          className={`flex items-center gap-2 text-xs transition-colors ${
            showComments ? 'text-primary-400' : 'text-dark-300 hover:text-white'
          }`}
        >
          <FiMessageCircle size={18} />
          <span>{commentsCount}</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-2 text-xs transition-colors ${
            bookmarked ? 'text-accent-amber' : 'text-dark-300 hover:text-accent-amber'
          }`}
        >
          <FiBookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-xs text-dark-300 hover:text-white transition-colors"
          title="Copy link"
        >
          <FiShare2 size={18} />
        </button>
      </div>

      {/* Inline Comments */}
      <AnimatePresence>
        {showComments && (
          <CommentSection
            postId={post._id}
            commentsCount={commentsCount}
            onCountChange={setCommentsCount}
          />
        )}
      </AnimatePresence>
    </motion.article>
  )
}
