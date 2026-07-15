import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMessageSquare, FiSend } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { useSelector } from 'react-redux'
import { selectMessages, selectTypingUsers } from '../../redux/slices/messageSlice'
import messageService from '../../services/message.service'
import { useSocket } from '../../context/SocketContext'
import useAuth from '../../hooks/useAuth'
import Avatar from '../../components/common/Avatar'
import toast from 'react-hot-toast'

export default function Messages() {
  const { id }          = useParams()
  const navigate        = useNavigate()
  const { user }        = useAuth()
  const socketCtx       = useSocket()
  const reduxMessages   = useSelector(selectMessages(id || ''))

  const [conversations, setConversations] = useState([])
  const [activeConv,    setActiveConv]    = useState(null)
  const [messages,      setMessages]      = useState([])
  const [text,          setText]          = useState('')
  const [isTyping,      setIsTyping]      = useState(false)
  const typingTimeout   = useRef(null)
  const messagesEnd     = useRef(null)

  // Fetch conversations on mount
  useEffect(() => {
    messageService.getConversations()
      .then((res) => setConversations(res.conversations || []))
      .catch(() => {})
  }, [])

  // Fetch messages when conversation id changes
  useEffect(() => {
    if (!id) return
    messageService.getMessages(id)
      .then((res) => setMessages(res.messages || []))
      .catch(() => {})

    const conv = conversations.find((c) => c._id === id)
    if (conv) setActiveConv(conv)

    socketCtx?.joinConversation(id)
    return () => socketCtx?.leaveConversation(id)
  }, [id, conversations.length])

  // Merge incoming redux messages
  useEffect(() => {
    if (reduxMessages.length) {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m._id))
        const newMsgs = reduxMessages.filter((m) => !existingIds.has(m._id))
        return [...prev, ...newMsgs]
      })
    }
  }, [reduxMessages])

  // Scroll to bottom
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Typing handler
  const handleTyping = (e) => {
    setText(e.target.value)
    if (!id) return
    socketCtx?.sendTyping(id, true)
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => socketCtx?.sendTyping(id, false), 1500)
  }

  // Listen for typing events from socket
  useEffect(() => {
    const socket = socketCtx?.socket
    if (!socket || !id) return

    const onTyping = ({ userId, conversationId, isTyping: typing }) => {
      if (conversationId === id && userId !== user?._id) {
        setIsTyping(typing)
      }
    }
    socket.on('chat:typing', onTyping)
    return () => socket.off('chat:typing', onTyping)
  }, [socketCtx?.socket, id, user?._id])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || !id) return
    socketCtx?.sendTyping(id, false)
    try {
      const res = await messageService.sendMessage(id, { content: text.trim() })
      const newMsg = res.message || res
      if (newMsg) setMessages((prev) => [...prev, newMsg])
      socketCtx?.notifyNewMessage(id, newMsg?._id)
      setText('')
    } catch (err) {
      console.error('Failed to send message:', err)
      console.log('API Error Data:', err.response?.data)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send message'
      toast.error(errorMsg)
    }
  }

  const getRecipient = (conv) =>
    conv.participants?.find((p) => p._id !== user?._id)

  // Real-time unread management and read receipts
  useEffect(() => {
    const socket = socketCtx?.socket
    if (!socket || !id) return

    // 1. Mark active chat as read
    socketCtx.markConversationRead(id)
    setConversations((prev) =>
      prev.map((c) => (c._id === id ? { ...c, unreadCount: 0 } : c))
    )

    // 2. Seen event listeners
    const onMessageSeen = ({ messageId, seenBy, seenAt }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, seenBy: [...(msg.seenBy || []), { user: seenBy, seenAt }] }
            : msg
        )
      )
    }

    const onConversationRead = ({ conversationId, readBy }) => {
      if (conversationId === id) {
        setMessages((prev) =>
          prev.map((msg) => {
            const isOwn = msg.sender?._id === user?._id || msg.sender === user?._id
            if (isOwn) {
              const alreadySeen = msg.seenBy?.some((s) => (s.user?._id || s.user) === readBy)
              if (!alreadySeen) {
                return {
                  ...msg,
                  seenBy: [...(msg.seenBy || []), { user: readBy, seenAt: new Date() }],
                }
              }
            }
            return msg
          })
        )
      }
    }

    const onNewMessage = ({ message, conversationId }) => {
      // Update sidebar list items dynamically
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === conversationId) {
            const isCurrent = conversationId === id
            return {
              ...c,
              lastMessage: message,
              unreadCount: isCurrent ? 0 : (c.unreadCount || 0) + 1,
            }
          }
          return c
        })
      )
      
      // If we are actively viewing this conversation, mark it as read immediately
      if (conversationId === id && message.sender?._id !== user?._id) {
        socketCtx.markConversationRead(id)
      }
    }

    socket.on('chat:message:seen', onMessageSeen)
    socket.on('chat:conversation:read', onConversationRead)
    socket.on('chat:message:new', onNewMessage)

    return () => {
      socket.off('chat:message:seen', onMessageSeen)
      socket.off('chat:conversation:read', onConversationRead)
      socket.off('chat:message:new', onNewMessage)
    }
  }, [socketCtx?.socket, id, messages.length])

  const renderCheckmarks = (msg) => {
    const isRead = msg.seenBy && msg.seenBy.length > 0 && msg.seenBy.some((s) => {
      const viewerId = s.user?._id || s.user
      return viewerId !== user?._id
    })

    if (isRead) {
      return (
        <span className="text-primary-300 ml-1.5 font-semibold text-xs shrink-0 select-none" title="Read">
          ✓✓
        </span>
      )
    }
    return (
      <span className="text-white/40 ml-1.5 text-xs shrink-0 select-none" title="Sent">
        ✓
      </span>
    )
  }

  return (
    <div className="glass-dark rounded-3xl border border-white/5 overflow-hidden flex h-[calc(100vh-8rem)]">
      {/* ── Left panel: Conversations ─── */}
      <div className="w-80 border-r border-white/5 flex flex-col shrink-0">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-white font-semibold text-sm">Messages</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 && (
            <p className="text-dark-400 text-sm text-center pt-8">No conversations yet.</p>
          )}
          {conversations.map((conv) => {
            const recipient = getRecipient(conv)
            const isOnline  = socketCtx?.isOnline(recipient?._id)
            const isActive  = activeConv?._id === conv._id

            return (
              <div
                key={conv._id}
                onClick={() => navigate(`/messages/${conv._id}`)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  isActive ? 'bg-primary-500/10 border border-primary-500/20' : 'hover:bg-white/5'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar user={recipient} size="sm" />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-accent-green border-2 border-dark-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {recipient?.fullName || recipient?.username}
                  </p>
                  <p className="text-dark-400 text-xs truncate">
                    {conv.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {conv.lastMessage?.createdAt && (
                    <p className="text-dark-500 text-xs">
                      {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                    </p>
                  )}
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Right panel: Chat ─── */}
      <div className="flex-1 flex flex-col bg-dark-900/40 min-w-0">
        {activeConv ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center gap-3 shrink-0">
              {(() => {
                const rec = getRecipient(activeConv)
                const online = socketCtx?.isOnline(rec?._id)
                return (
                  <>
                    <div className="relative">
                      <Avatar user={rec} size="sm" />
                      {online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-accent-green border-2 border-dark-900" />
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">
                        {rec?.fullName || rec?.username}
                      </p>
                      <p className={`text-xs ${online ? 'text-accent-green' : 'text-dark-400'}`}>
                        {online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.sender?._id === user?._id || msg.sender === user?._id
                return (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-sm rounded-2xl px-4 py-2.5 text-sm ${
                        isOwn
                          ? 'bg-primary-500 text-white rounded-br-none'
                          : 'bg-dark-800 text-white/90 rounded-bl-none border border-white/5'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.content}</p>
                      {msg.createdAt && (
                        <p className={`text-[10px] mt-1 flex items-center justify-end ${isOwn ? 'text-white/60' : 'text-dark-400'}`}>
                          <span>{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                          {isOwn && renderCheckmarks(msg)}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )
              })}

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="bg-dark-800 rounded-2xl rounded-bl-none px-4 py-2.5 border border-white/5 flex items-center gap-1">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-dark-400"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEnd} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="p-4 border-t border-white/5 flex gap-3 shrink-0"
            >
              <input
                type="text"
                placeholder="Type a message..."
                value={text}
                onChange={handleTyping}
                className="input-dark flex-1"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="btn-primary !p-3 disabled:opacity-50"
              >
                <FiSend size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-dark-400 gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center">
              <FiMessageSquare size={28} className="text-primary-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium mb-1">Your Messages</p>
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
