/**
 * redux/store.js — Redux Toolkit Store
 */

import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import postReducer from './slices/postSlice'
import notificationReducer from './slices/notificationSlice'
import messageReducer from './slices/messageSlice'
import uiReducer from './slices/uiSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postReducer,
    notifications: notificationReducer,
    messages: messageReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
})

export default store
