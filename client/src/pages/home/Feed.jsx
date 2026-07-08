import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchFeed, selectFeed, selectPostsLoading, prependPost } from '../../redux/slices/postSlice'
import PostCard from '../../components/posts/PostCard'
import PostForm from '../../components/posts/PostForm'
import postService from '../../services/post.service'
import toast from 'react-hot-toast'

export default function Feed() {
  const dispatch = useDispatch()
  const posts = useSelector(selectFeed)
  const loading = useSelector(selectPostsLoading)

  useEffect(() => {
    dispatch(fetchFeed({ page: 1 }))
  }, [dispatch])

  const handlePostCreated = (newPost) => {
    dispatch(prependPost(newPost))
  }

  const handleDeletePost = async (postId) => {
    try {
      await postService.deletePost(postId)
      toast.success('Post deleted')
      dispatch(fetchFeed({ page: 1 }))
    } catch (err) {
      toast.error('Failed to delete post')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PostForm onPostCreated={handlePostCreated} />

      {loading && posts.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-dark rounded-2xl p-5 h-48 skeleton" />
          ))}
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} onDelete={handleDeletePost} />
        ))}
      </div>

      {!loading && posts.length === 0 && (
        <div className="text-center py-12 glass-dark rounded-2xl border border-white/5">
          <p className="text-dark-400">No posts in your feed yet. Start sharing or follow users!</p>
        </div>
      )}
    </div>
  )
}
