import api from './api'

const postService = {
  createPost: (formData) => api.post('/posts', formData),
  getFeed: (params) => api.get('/posts/feed', { params }),
  getTrending: (params) => api.get('/posts/trending', { params }),
  getPost: (id) => api.get(`/posts/${id}`),
  updatePost: (id, data) => api.put(`/posts/${id}`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
  toggleLike: (id) => api.post(`/posts/${id}/like`),
  toggleBookmark: (id) => api.post(`/posts/${id}/bookmark`),
  getBookmarks: (params) => api.get('/posts/bookmarks', { params }),
}

export default postService
