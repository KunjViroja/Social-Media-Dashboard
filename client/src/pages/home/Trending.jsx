import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiTrendingUp, FiHash } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTrending, selectTrending, selectPostsLoading } from '../../redux/slices/postSlice'
import api from '../../services/api'
import PostCard from '../../components/posts/PostCard'

export default function Trending() {
  const dispatch  = useDispatch()
  const posts     = useSelector(selectTrending)
  const loading   = useSelector(selectPostsLoading)
  const [hashtags, setHashtags] = useState([])

  useEffect(() => {
    dispatch(fetchTrending({ page: 1, limit: 20 }))
    api.get('/search/trending-hashtags')
      .then((res) => setHashtags(res.trending?.slice(0, 10) || []))
      .catch(() => {})
  }, [dispatch])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-accent-pink/10 flex items-center justify-center">
            <FiTrendingUp className="text-accent-pink" size={18} />
          </div>
          <h1 className="text-2xl font-bold text-white">Trending</h1>
        </div>
        <p className="text-dark-400 text-sm">Top posts and hashtags across the platform</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left — trending posts */}
        <div className="flex-1 min-w-0 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider text-dark-400">
            Top Posts
          </h2>

          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="glass-dark rounded-2xl p-5 h-48 skeleton" />
              ))}
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="glass-dark rounded-2xl p-10 border border-white/5 text-center">
              <p className="text-dark-400">No trending posts right now. Start posting!</p>
            </div>
          )}

          {posts.map((post, i) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <PostCard post={post} onDelete={() => {}} />
            </motion.div>
          ))}
        </div>

        {/* Right — trending hashtags */}
        {hashtags.length > 0 && (
          <div className="xl:w-64 shrink-0">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider text-dark-400 mb-4">
              Trending Hashtags
            </h2>
            <div className="glass-dark rounded-2xl p-4 border border-white/5 space-y-1">
              {hashtags.map((tag, i) => (
                <Link
                  key={tag.hashtag}
                  to={`/search?q=${encodeURIComponent('#' + tag.hashtag)}&type=hashtag`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-primary-500/10 flex items-center justify-center">
                      <FiHash size={11} className="text-primary-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium group-hover:text-primary-300 transition-colors">
                        #{tag.hashtag}
                      </p>
                      <p className="text-dark-400 text-xs">{tag.count} posts</p>
                    </div>
                  </div>
                  <span className="text-dark-500 text-xs font-bold">#{i + 1}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
