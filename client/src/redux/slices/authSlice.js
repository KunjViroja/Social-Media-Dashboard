/**
 * redux/slices/authSlice.js — Authentication State
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authService from '../../services/auth.service'

// ── Async Thunks ──────────────────────────────────

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await authService.login(credentials)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed')
  }
})

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const data = await authService.register(userData)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed')
  }
})

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authService.logout()
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Logout failed')
  }
})

export const fetchCurrentUser = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const data = await authService.getMe()
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Session expired')
  }
})

export const refreshAccessToken = createAsyncThunk('auth/refresh', async (_, { rejectWithValue }) => {
  try {
    const data = await authService.refreshToken()
    return data
  } catch (err) {
    return rejectWithValue('Session expired')
  }
})

// ── Slice ─────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false, // true after first auth check
    error: null,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.isAuthenticated = true
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    },
    clearAuth: (state) => {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => { state.isLoading = true; state.error = null })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Register
      .addCase(registerUser.pending, (state) => { state.isLoading = true; state.error = null })
      .addCase(registerUser.fulfilled, (state) => { state.isLoading = false })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false; state.error = action.payload
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
        state.isAuthenticated = false
      })
      // Fetch me
      .addCase(fetchCurrentUser.pending, (state) => { state.isLoading = true })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.isAuthenticated = true
        state.isInitialized = true
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false
        state.isInitialized = true
        state.isAuthenticated = false
      })
      // Refresh
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.user = null
        state.isAuthenticated = false
      })
  },
})

export const { setCredentials, updateUser, clearAuth, clearError } = authSlice.actions

// Selectors
export const selectCurrentUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectAuthLoading = (state) => state.auth.isLoading
export const selectAuthError = (state) => state.auth.error
export const selectIsInitialized = (state) => state.auth.isInitialized

export default authSlice.reducer
