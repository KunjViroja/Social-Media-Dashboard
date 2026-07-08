import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { FiMessageSquare, FiSend } from 'react-icons/fi'
import messageService from '../../services/message.service'
import { useSocket } from '../../context/SocketContext'
import useAuth from '../../hooks/useAuth'
import Avatar from '../../components/common/Avatar'

export default function Messages() {
  const { id } = useParams()
  const { user } = useAuth()
  const socketContext = useSocket()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')

  useEffect(() => {
    const fetchConvs = async () => {
      try {
        const res = await messageService.getConversations()
        setConversations(res.conversations || [])
      } catch {}
    }
    fetchConvs()
  }, [])

  useEffect(() => {
    if (!id) return
    const fetchMsgs = async () => {
      try {
        const res = await messageService.getMessages(id)
        setMessages(res.messages || [])
        const active = conversations.find((c) => c._id === id)
        if (active) setActiveConv(active)
      } catch {}
    }
    fetchMsgs()
    socketContext?.joinConversation(id)

    return () => {
      socketContext?.leaveConversation(id)
    }
  }, [id, conversations])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim()) return

    try {
      const res = await messageService.sendMessage(id, { content: text })
      setMessages((prev) => [...prev, res.data.message])
      socketContext?.notifyNewMessage(id, res.data.message._id)
      setText('')
    } catch {}
  }

  return (
    <div className="glass-dark rounded-3xl border border-white/5 overflow-hidden flex h-[calc(100vh-8rem)]">
      {/* Left panel — Conversations */}
      <div className="w-80 border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-white font-semibold">Chats</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => {
            const recipient = conv.participants.find((p) => p._id !== user._id)
            return (
              <div
                key={conv._id}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors ${activeConv?._id === conv._id ? 'bg-white/5' : ''}`}
                onClick={() => window.location.replace(`/messages/${conv._id}`)}
              >
                <Avatar user={recipient} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{recipient?.fullName || recipient?.username}</p>
                  <p className="text-dark-400 text-xs truncate">{conv.lastMessage?.content || 'No messages'}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right panel — Chat Messages */}
      <div className="flex-1 flex flex-col bg-dark-900/40">
        {activeConv ? (
          <>
            <div className="p-4 border-b border-white/5 flex items-center gap-3">
              <Avatar user={activeConv.participants.find((p) => p._id !== user._id)} size="sm" />
              <div>
                <p className="text-white text-sm font-semibold">{activeConv.participants.find((p) => p._id !== user._id)?.fullName}</p>
                <p className="text-dark-400 text-xs">Active now</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isOwn = msg.sender._id === user._id
                return (
                  <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md rounded-2xl p-3 text-sm ${isOwn ? 'bg-primary-500 text-white rounded-br-none' : 'bg-dark-800 text-white/90 rounded-bl-none'}`}>
                      {msg.content}
                    </div>
                  </div>
                )
              })}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-white/5 flex gap-3">
              <input
                type="text"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="input-dark flex-1"
              />
              <button type="submit" className="btn-primary !p-3">
                <FiSend size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-dark-400">
            <FiMessageSquare size={48} className="mb-4 text-dark-500" />
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
}
