import { createSlice } from '@reduxjs/toolkit'

const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    conversations: [],
    activeConversationId: null,
    messages: {},           // { [conversationId]: Message[] }
    typingUsers: {},        // { [conversationId]: userId[] }
    isLoading: false,
  },
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload
    },
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload
    },
    setMessages: (state, action) => {
      const { conversationId, messages } = action.payload
      state.messages[conversationId] = messages
    },
    appendMessages: (state, action) => {
      const { conversationId, messages } = action.payload
      const existing = state.messages[conversationId] || []
      state.messages[conversationId] = [...messages, ...existing]
    },
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload
      if (!state.messages[conversationId]) state.messages[conversationId] = []
      state.messages[conversationId].push(message)

      // Update conversation's last message
      const conv = state.conversations.find((c) => c._id === conversationId)
      if (conv) {
        conv.lastMessage = message
        conv.lastMessageAt = message.createdAt
      }
    },
    setTyping: (state, action) => {
      const { conversationId, userId, isTyping } = action.payload
      if (!state.typingUsers[conversationId]) state.typingUsers[conversationId] = []
      if (isTyping) {
        if (!state.typingUsers[conversationId].includes(userId)) {
          state.typingUsers[conversationId].push(userId)
        }
      } else {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter((id) => id !== userId)
      }
    },
    markConversationRead: (state, action) => {
      const conv = state.conversations.find((c) => c._id === action.payload)
      if (conv) conv.unreadCount = 0
    },
  },
})

export const { setConversations, setActiveConversation, setMessages, appendMessages, addMessage, setTyping, markConversationRead } = messageSlice.actions
export const selectConversations = (state) => state.messages.conversations
export const selectActiveConversationId = (state) => state.messages.activeConversationId
export const selectMessages = (conversationId) => (state) => state.messages.messages[conversationId] || []
export const selectTypingUsers = (conversationId) => (state) => state.messages.typingUsers[conversationId] || []

export default messageSlice.reducer
