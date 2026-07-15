import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiTrendingUp, FiUserPlus } from 'react-icons/fi'
import userService from '../../services/user.service'
import api from '../../services/api'
import Avatar from '../common/Avatar'

export default function RightPanel() {
  const [suggestions, setSuggestions] = useState([])
  const [trending, setTrending] = useState([])
  const [following, setFollowing] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suggestData, trendingData] = await Promise.all([
          userService.getSuggestions(),
          api.get('/search/trending-hashtags'),
        ])
        setSuggestions(suggestData.suggestions?.slice(0, 5) || [])
        setTrending(trendingData.trending?.slice(0, 8) || [])
      } catch {}
    }
    fetchData()
  }, [])

  const handleFollow = async (userId) => {
    try {
      await userService.followUser(userId)
      setFollowing((prev) => ({ ...prev, [userId]: true }))
    } catch {}
  }

  return (
    <aside className="hidden xl:flex flex-col w-72 shrink-0 gap-4">
      {/* Suggested Users */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-2xl p-5"
        >
          <h3 className="text-white font-semibold text-sm mb-4">Who to Follow</h3>
          <div className="space-y-4">
            {suggestions.map((user) => (
              <div key={user._id} className="flex items-center gap-3">
                <Link to={`/profile/${user.username}`}>
                  <Avatar user={user} size="sm" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${user.username}`} className="text-white text-sm font-medium hover:underline truncate block">
                    {user.fullName || user.username}
                  </Link>
                  <p className="text-dark-400 text-xs truncate">@{user.username}</p>
                </div>
                {!following[user._id] && (
                  <button
                    onClick={() => handleFollow(user._id)}
                    className="p-1.5 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors"
                  >
                    <FiUserPlus size={14} />
                  </button>
                )}
                {following[user._id] && (
                  <span className="text-xs text-accent-green font-medium">Following</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Trending Hashtags */}
      {trending.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-dark rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <FiTrendingUp className="text-accent-pink" size={16} />
            <h3 className="text-white font-semibold text-sm">Trending</h3>
          </div>
          <div className="space-y-2.5">
            {trending.map((item, i) => (
              <Link
                key={item.hashtag}
                to={`/search?q=${encodeURIComponent(item.hashtag)}&type=hashtag`}
                className="flex items-center justify-between group hover:bg-white/5 -mx-2 px-2 py-1 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-primary-400 font-medium text-sm group-hover:text-primary-300">#{item.hashtag}</p>
                  <p className="text-dark-400 text-xs">{item.count} posts</p>
                </div>
                <span className="text-dark-500 text-xs">#{i + 1}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      <p className="text-dark-500 text-xs px-2">
        © {new Date().getFullYear()} SocialHub · Built by Kunj Viroja
      </p>
    </aside>
  )
}
