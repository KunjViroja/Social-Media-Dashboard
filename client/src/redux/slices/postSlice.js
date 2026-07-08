import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import postService from '../../services/post.service'

export const fetchFeed = createAsyncThunk('posts/fetchFeed', async (params, { rejectWithValue }) => {
  try { return await postService.getFeed(params) }
  catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const fetchTrending = createAsyncThunk('posts/fetchTrending', async (params, { rejectWithValue }) => {
  try { return await postService.getTrending(params) }
  catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const createPost = createAsyncThunk('posts/create', async (formData, { rejectWithValue }) => {
  try { return await postService.createPost(formData) }
  catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const deletePost = createAsyncThunk('posts/delete', async (postId, { rejectWithValue }) => {
  try { await postService.deletePost(postId); return postId }
  catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const toggleLike = createAsyncThunk('posts/toggleLike', async (postId, { rejectWithValue }) => {
  try { return await postService.toggleLike(postId) }
  catch (err) { return rejectWithValue(err.response?.data?.message) }
})

const postSlice = createSlice({
  name: 'posts',
  initialState: {
    feed: [],
    trending: [],
    isLoading: false,
    isCreating: false,
    hasMore: true,
    currentPage: 1,
    error: null,
  },
  reducers: {
    resetFeed: (state) => {
      state.feed = []
      state.currentPage = 1
      state.hasMore = true
    },
    appendFeed: (state, action) => {
      const existingIds = new Set(state.feed.map((p) => p._id))
      const newPosts = action.payload.filter((p) => !existingIds.has(p._id))
      state.feed = [...state.feed, ...newPosts]
    },
    updatePostInFeed: (state, action) => {
      const idx = state.feed.findIndex((p) => p._id === action.payload._id)
      if (idx !== -1) state.feed[idx] = action.payload
    },
    prependPost: (state, action) => {
      state.feed = [action.payload, ...state.feed]
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => { state.isLoading = true })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.isLoading = false
        const { posts, pagination } = action.payload
        const existingIds = new Set(state.feed.map((p) => p._id))
        const newPosts = posts.filter((p) => !existingIds.has(p._id))
        state.feed = [...state.feed, ...newPosts]
        state.hasMore = pagination.hasNextPage
        state.currentPage = pagination.page
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.isLoading = false; state.error = action.payload
      })
      .addCase(fetchTrending.fulfilled, (state, action) => {
        state.trending = action.payload.posts
      })
      .addCase(createPost.pending, (state) => { state.isCreating = true })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isCreating = false
        state.feed = [action.payload.post, ...state.feed]
      })
      .addCase(createPost.rejected, (state) => { state.isCreating = false })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.feed = state.feed.filter((p) => p._id !== action.payload)
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const { postId, isLiked, likesCount } = action.payload || {}
        const post = state.feed.find((p) => p._id === postId)
        if (post) { post.isLiked = isLiked; post.likesCount = likesCount }
      })
  },
})

export const { resetFeed, appendFeed, updatePostInFeed, prependPost } = postSlice.actions
export const selectFeed = (state) => state.posts.feed
export const selectTrending = (state) => state.posts.trending
export const selectPostsLoading = (state) => state.posts.isLoading
export const selectHasMore = (state) => state.posts.hasMore
export const selectCurrentPage = (state) => state.posts.currentPage

export default postSlice.reducer
