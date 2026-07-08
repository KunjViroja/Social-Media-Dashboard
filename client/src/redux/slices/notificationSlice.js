import { createSlice } from '@reduxjs/toolkit'

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    isLoading: false,
    hasMore: true,
  },
  reducers: {
    setNotifications: (state, action) => {
      state.items = action.payload.notifications
      state.unreadCount = action.payload.unreadCount
    },
    appendNotifications: (state, action) => {
      const existingIds = new Set(state.items.map((n) => n._id))
      const newItems = action.payload.notifications.filter((n) => !existingIds.has(n._id))
      state.items = [...state.items, ...newItems]
      state.hasMore = action.payload.pagination?.hasNextPage || false
    },
    addLiveNotification: (state, action) => {
      state.items = [action.payload, ...state.items]
      state.unreadCount += 1
    },
    markRead: (state, action) => {
      const notif = state.items.find((n) => n._id === action.payload)
      if (notif && !notif.isRead) {
        notif.isRead = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllRead: (state) => {
      state.items.forEach((n) => (n.isRead = true))
      state.unreadCount = 0
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload
    },
  },
})

export const { setNotifications, appendNotifications, addLiveNotification, markRead, markAllRead, setUnreadCount } = notificationSlice.actions
export const selectNotifications = (state) => state.notifications.items
export const selectUnreadCount = (state) => state.notifications.unreadCount

export default notificationSlice.reducer
