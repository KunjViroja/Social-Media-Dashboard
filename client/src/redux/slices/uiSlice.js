import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    theme: 'dark',
    modalOpen: null,      // null | 'createPost' | 'editProfile' | ...
    searchQuery: '',
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen },
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload },
    openModal: (state, action) => { state.modalOpen = action.payload },
    closeModal: (state) => { state.modalOpen = null },
    setSearchQuery: (state, action) => { state.searchQuery = action.payload },
  },
})

export const { toggleSidebar, setSidebarOpen, openModal, closeModal, setSearchQuery } = uiSlice.actions
export const selectSidebarOpen = (state) => state.ui.sidebarOpen
export const selectModalOpen = (state) => state.ui.modalOpen
export const selectSearchQuery = (state) => state.ui.searchQuery

export default uiSlice.reducer
