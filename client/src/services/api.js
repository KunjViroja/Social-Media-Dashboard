/**
 * services/api.js — Axios Instance with Interceptors
 * Handles token refresh, error normalization, and auth headers
 */

import axios from 'axios'
import store from '../redux/store'
import { refreshAccessToken, clearAuth } from '../redux/slices/authSlice'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,   // Include cookies
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request Interceptor — attach access token ──
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor — handle 401 + refresh ──
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response.data,  // Return data directly
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const result = await store.dispatch(refreshAccessToken()).unwrap()
        const newToken = result.accessToken
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        store.dispatch(clearAuth())
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
