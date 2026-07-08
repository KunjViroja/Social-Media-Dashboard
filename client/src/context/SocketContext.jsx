/**
 * context/SocketContext.jsx — Socket.IO Client Context
 * Provides socket instance and online users to entire app
 */

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useSelector, useDispatch } from 'react-redux'
import { selectIsAuthenticated, selectCurrentUser } from '../redux/slices/authSlice'
import { addLiveNotification, setUnreadCount } from '../redux/slices/notificationSlice'
import { addMessage, setTyping } from '../redux/slices/messageSlice'
import toast from 'react-hot-toast'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const currentUser = useSelector(selectCurrentUser)
  const socketRef = useRef(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const accessToken = useSelector((state) => state.auth.accessToken)

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    // Connect to Socket.IO server
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: accessToken },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    const socket = socketRef.current

    // ── Connection events ──────────────────────
    socket.on('connect', () => {
      console.log('🔌 Socket connected')
      socket.emit('presence:get-online')
    })

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected')
    })

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
    })

    // ── Presence events ────────────────────────
    socket.on('presence:online-users', ({ onlineUsers }) => {
      setOnlineUsers(onlineUsers)
    })

    socket.on('user:online', ({ userId }) => {
      setOnlineUsers((prev) => [...new Set([...prev, userId])])
    })

    socket.on('user:offline', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId))
    })

    // ── Notification events ────────────────────
    socket.on('notification:new', ({ notification }) => {
      dispatch(addLiveNotification(notification))
      toast.success(notification.text, {
        icon: '🔔',
        duration: 3000,
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)' },
      })
    })

    socket.on('notification:count', ({ count }) => {
      dispatch(setUnreadCount(count))
    })

    // ── Chat events ────────────────────────────
    socket.on('chat:message:new', ({ message, conversationId }) => {
      dispatch(addMessage({ conversationId, message }))
    })

    socket.on('chat:typing', ({ userId, conversationId, isTyping }) => {
      if (userId !== currentUser?._id) {
        dispatch(setTyping({ conversationId, userId, isTyping }))
      }
    })

    // Heartbeat to keep Redis presence alive
    const heartbeat = setInterval(() => {
      socket.emit('presence:heartbeat')
    }, 30000)

    return () => {
      clearInterval(heartbeat)
      socket.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated, accessToken])

  const joinConversation = (conversationId) => {
    socketRef.current?.emit('conversation:join', conversationId)
  }

  const leaveConversation = (conversationId) => {
    socketRef.current?.emit('conversation:leave', conversationId)
  }

  const sendTyping = (conversationId, isTyping) => {
    socketRef.current?.emit('chat:typing', { conversationId, isTyping })
  }

  const notifyNewMessage = (conversationId, messageId) => {
    socketRef.current?.emit('chat:message:send', { conversationId, messageId })
  }

  const markMessageRead = (messageId, conversationId) => {
    socketRef.current?.emit('chat:message:read', { messageId, conversationId })
  }

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      onlineUsers,
      isOnline: (userId) => onlineUsers.includes(userId),
      joinConversation,
      leaveConversation,
      sendTyping,
      notifyNewMessage,
      markMessageRead,
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) throw new Error('useSocket must be used within SocketProvider')
  return context
}

export default SocketContext
