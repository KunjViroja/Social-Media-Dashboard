import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiMapPin, FiLink, FiCalendar, FiEdit2, FiSend } from 'react-icons/fi'
import userService from '../../services/user.service'
import messageService from '../../services/message.service'
import useAuth from '../../hooks/useAuth'
import Avatar from '../../components/common/Avatar'
import PostCard from '../../components/posts/PostCard'
import toast from 'react-hot-toast'

export default function Profile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [profileUser, setProfileUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const profileRes = await userService.getProfile(username)
        setProfileUser(profileRes.user)
        setIsFollowing(profileRes.isFollowing)

        const postsRes = await userService.getUserPosts(username)
        setPosts(postsRes.posts || [])
      } catch (err) {
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [username])

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await userService.unfollowUser(profileUser._id)
        setIsFollowing(false)
        setProfileUser((prev) => ({ ...prev, followersCount: prev.followersCount - 1 }))
        toast.success('Unfollowed user')
      } else {
        await userService.followUser(profileUser._id)
        setIsFollowing(true)
        setProfileUser((prev) => ({ ...prev, followersCount: prev.followersCount + 1 }))
        toast.success('Followed user')
      }
    } catch {
      toast.error('Operation failed')
    }
  }

  const handleMessageStart = async () => {
    try {
      const res = await messageService.getOrCreateConversation(profileUser._id)
      const conv = res.conversation || res
      if (conv?._id) {
        navigate(`/messages/${conv._id}`)
      }
    } catch {
      toast.error('Failed to start conversation')
    }
  }

  if (loading) return <div className="text-center py-12 text-dark-400">Loading profile...</div>
  if (!profileUser) return <div className="text-center py-12 text-dark-400">User not found</div>

  const isOwnProfile = currentUser?._id === profileUser._id

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="glass-dark rounded-3xl overflow-hidden border border-white/5 relative">
        <div className="h-44 bg-gradient-to-r from-primary-600 to-accent-violet relative">
          {profileUser.coverImage?.url && (
            <img src={profileUser.coverImage.url} alt="Cover" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="px-6 pb-6 relative">
          <div className="absolute -top-16 left-6">
            <Avatar user={profileUser} size="2xl" />
          </div>

          <div className="flex justify-end pt-4 gap-3">
            {isOwnProfile ? (
              <Link to="/settings/profile" className="btn-ghost !px-4 !py-2 flex items-center gap-2">
                <FiEdit2 size={16} />
                <span>Edit Profile</span>
              </Link>
            ) : (
              <>
                <button
                  onClick={handleMessageStart}
                  className="btn-ghost !px-4 !py-2 flex items-center gap-2 border border-white/10"
                >
                  <FiSend size={15} />
                  <span>Message</span>
                </button>
                <button
                  onClick={handleFollowToggle}
                  className={`btn-primary !px-6 !py-2 ${isFollowing ? '!bg-dark-800 border-white/10 hover:!bg-dark-700' : ''}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </>
            )}
          </div>

          <div className="mt-6">
            <h1 className="text-2xl font-bold text-white leading-tight">{profileUser.fullName || profileUser.username}</h1>
            <p className="text-dark-400 text-sm">@{profileUser.username}</p>
          </div>

          {profileUser.bio && <p className="text-white/90 text-sm mt-4 leading-relaxed">{profileUser.bio}</p>}

          <div className="flex flex-wrap gap-4 mt-4 text-xs text-dark-400">
            {profileUser.location && (
              <div className="flex items-center gap-1.5">
                <FiMapPin />
                <span>{profileUser.location}</span>
              </div>
            )}
            {profileUser.website && (
              <div className="flex items-center gap-1.5 hover:text-primary-400 transition-colors">
                <FiLink />
                <a href={profileUser.website} target="_blank" rel="noreferrer">{profileUser.website}</a>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <FiCalendar />
              <span>Joined {new Date(profileUser.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          <div className="flex gap-6 mt-6 border-t border-white/5 pt-6 text-sm">
            <div>
              <span className="font-bold text-white">{profileUser.followingCount}</span>
              <span className="text-dark-400 ml-1.5">Following</span>
            </div>
            <div>
              <span className="font-bold text-white">{profileUser.followersCount}</span>
              <span className="text-dark-400 ml-1.5">Followers</span>
            </div>
            <div>
              <span className="font-bold text-white">{profileUser.postsCount}</span>
              <span className="text-dark-400 ml-1.5">Posts</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Posts */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white px-2">Posts</h2>
        {posts.map((post) => (
          <PostCard key={post._id} post={{ ...post, author: profileUser }} onDelete={() => {}} />
        ))}
        {posts.length === 0 && (
          <p className="text-center text-dark-500 py-8">No posts yet.</p>
        )}
      </div>
    </div>
  )
}
