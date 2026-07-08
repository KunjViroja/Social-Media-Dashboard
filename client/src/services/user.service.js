import api from './api'

const userService = {
  getProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (data) => api.put('/users/me', data),
  uploadAvatar: (formData) => api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadCover: (formData) => api.post('/users/me/cover', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  followUser: (id) => api.post(`/users/${id}/follow`),
  unfollowUser: (id) => api.post(`/users/${id}/unfollow`),
  getFollowers: (id, params) => api.get(`/users/${id}/followers`, { params }),
  getFollowing: (id, params) => api.get(`/users/${id}/following`, { params }),
  getSuggestions: () => api.get('/users/suggestions'),
  getUserPosts: (username, params) => api.get(`/users/${username}/posts`, { params }),
}

export default userService
