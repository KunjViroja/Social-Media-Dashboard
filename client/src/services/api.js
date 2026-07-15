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
  (response) => {
    // If the response is standard ApiResponse, return response.data.data if present,
    // otherwise fallback to response.data (for messages, success flags, etc.)
    if (
      response.data &&
      Object.prototype.hasOwnProperty.call(response.data, 'data') &&
      response.data.data !== null &&
      response.data.data !== undefined
    ) {
      return response.data.data
    }
    return response.data
  },
  async (error) => {
    const originalRequest = error.config
    const url = originalRequest?.url || ''

    const isAuthRequest = url.includes('/auth/login') ||
                          url.includes('/auth/register') ||
                          url.includes('/auth/refresh-token')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
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
        // Avoid redirect loop if we are already on login or register
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
