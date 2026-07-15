import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiSearch, FiUser, FiFileText, FiHash, FiUserPlus, FiLoader } from 'react-icons/fi'
import useDebounce from '../../hooks/useDebounce'
import api from '../../services/api'
import userService from '../../services/user.service'
import Avatar from '../../components/common/Avatar'
import PostCard from '../../components/posts/PostCard'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'users',    label: 'Users',    Icon: FiUser },
  { key: 'posts',    label: 'Posts',    Icon: FiFileText },
  { key: 'hashtags', label: 'Hashtags', Icon: FiHash },
]

export default function Search() {
  const [query,      setQuery]      = useState('')
  const [tab,        setTab]        = useState('users')
  const [results,    setResults]    = useState({ users: [], posts: [], hashtags: [] })
  const [loading,    setLoading]    = useState(false)
  const [following,  setFollowing]  = useState({})
  const debouncedQ   = useDebounce(query, 450)

  useEffect(() => {
    if (!debouncedQ.trim()) {
      setResults({ users: [], posts: [], hashtags: [] })
      return
    }

    const search = async () => {
      setLoading(true)
      try {
        const [usersRes, postsRes, tagsRes] = await Promise.all([
          api.get('/search/users', { params: { q: debouncedQ, limit: 10 } }),
          api.get('/search/posts', { params: { q: debouncedQ, limit: 10 } }),
          api.get('/search/hashtag', { params: { q: debouncedQ, limit: 10 } }),
        ])

        const cleanTag = debouncedQ.replace('#', '').trim()
        const matchedHashtag = tagsRes.posts?.length > 0
          ? [{ hashtag: cleanTag, count: tagsRes.posts.length }]
          : []

        setResults({
          users:    usersRes.users    || [],
          posts:    postsRes.posts    || [],
          hashtags: matchedHashtag,
        })
      } catch {
        toast.error('Search failed')
      } finally {
        setLoading(false)
      }
    }

    search()
  }, [debouncedQ])

  const handleFollow = async (userId) => {
    try {
      await userService.followUser(userId)
      setFollowing((prev) => ({ ...prev, [userId]: true }))
    } catch {}
  }

  const activeCount = results[tab]?.length || 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-4">Search</h1>

        {/* Search input */}
        <div className="relative">
          <FiSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400"
            size={18}
          />
          {loading && (
            <FiLoader
              className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 animate-spin"
              size={16}
            />
          )}
          <input
            type="text"
            placeholder="Search users, posts, hashtags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-dark pl-12 pr-12 py-4 text-base"
            autoFocus
          />
        </div>
      </div>

      {/* Tabs */}
      {debouncedQ.trim() && (
        <div className="flex gap-1 glass-dark rounded-xl p-1 border border-white/5">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === key
                  ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                  : 'text-dark-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={15} />
              <span>{label}</span>
              {results[key]?.length > 0 && (
                <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">
                  {results[key].length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {!debouncedQ.trim() ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-dark rounded-3xl p-16 border border-white/5 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
              <FiSearch size={28} className="text-primary-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Search SocialHub</h3>
            <p className="text-dark-400 text-sm">
              Find people, posts, and trending topics
            </p>
          </motion.div>
        ) : loading ? (
          <motion.div key="loading" className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-dark rounded-2xl p-4 h-20 skeleton" />
            ))}
          </motion.div>
        ) : activeCount === 0 ? (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-dark rounded-2xl p-10 border border-white/5 text-center"
          >
            <p className="text-dark-400">
              No {tab} found for <span className="text-white font-medium">"{debouncedQ}"</span>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`${tab}-${debouncedQ}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* USERS */}
            {tab === 'users' && results.users.map((user) => (
              <div
                key={user._id}
                className="glass-dark rounded-2xl p-4 border border-white/5 flex items-center gap-3 hover:border-white/10 transition-all"
              >
                <Link to={`/profile/${user.username}`}>
                  <Avatar user={user} size="md" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/profile/${user.username}`}
                    className="text-white font-semibold hover:underline block truncate"
                  >
                    {user.fullName || user.username}
                  </Link>
                  <p className="text-dark-400 text-xs truncate">@{user.username}</p>
                  {user.bio && (
                    <p className="text-dark-300 text-xs mt-1 line-clamp-1">{user.bio}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center">
                    <p className="text-white text-sm font-semibold">{user.followersCount || 0}</p>
                    <p className="text-dark-400 text-xs">followers</p>
                  </div>
                  {!following[user._id] ? (
                    <button
                      onClick={() => handleFollow(user._id)}
                      className="btn-primary !px-4 !py-1.5 text-xs flex items-center gap-1.5"
                    >
                      <FiUserPlus size={13} />
                      Follow
                    </button>
                  ) : (
                    <span className="text-xs text-accent-green font-medium px-3 py-1.5 bg-accent-green/10 rounded-lg">
                      Following
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* POSTS */}
            {tab === 'posts' && results.posts.map((post) => (
              <PostCard key={post._id} post={post} onDelete={() => {}} />
            ))}

            {/* HASHTAGS */}
            {tab === 'hashtags' && results.hashtags.map((tag, i) => (
              <Link
                key={tag.hashtag || i}
                to={`/search?q=${encodeURIComponent('#' + tag.hashtag)}&type=hashtag`}
                className="glass-dark rounded-2xl p-4 border border-white/5 flex items-center gap-4 hover:border-primary-500/30 hover:bg-primary-500/5 transition-all group block"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                  <FiHash className="text-primary-400" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold group-hover:text-primary-300 transition-colors">
                    #{tag.hashtag}
                  </p>
                  <p className="text-dark-400 text-xs">{tag.count || 0} posts</p>
                </div>
                <span className="text-dark-500 text-sm font-bold">#{i + 1}</span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
