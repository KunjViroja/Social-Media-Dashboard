import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiSearch, FiBell, FiLogOut, FiSettings } from 'react-icons/fi'
import { logoutUser } from '../../redux/slices/authSlice'
import { selectCurrentUser } from '../../redux/slices/authSlice'
import { selectUnreadCount } from '../../redux/slices/notificationSlice'
import { setSearchQuery } from '../../redux/slices/uiSlice'
import Avatar from '../common/Avatar'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const currentUser = useSelector(selectCurrentUser)
  const unreadCount = useSelector(selectUnreadCount)
  const [search, setSearch] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      dispatch(setSearchQuery(search))
      navigate(`/search?q=${encodeURIComponent(search)}`)
    }
  }

  const handleLogout = async () => {
    await dispatch(logoutUser())
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <header className="h-16 border-b border-white/5 bg-dark-900/60 backdrop-blur-xl flex items-center px-6 gap-4 sticky top-0 z-20">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-lg">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
          <input
            type="text"
            placeholder="Search users, posts, hashtags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark pl-9 h-9 text-sm"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications bell */}
        <Link to="/notifications" className="relative p-2 rounded-xl text-dark-300 hover:text-white hover:bg-white/5 transition-colors">
          <FiBell size={20} />
          {unreadCount > 0 && (
            <span className="badge absolute top-1 right-1 text-[9px] min-w-[16px] h-4">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </Link>

        {/* Profile menu */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
          >
            <Avatar user={currentUser} size="sm" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-52 glass-dark rounded-2xl border border-white/10 shadow-2xl py-2 z-50">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-white font-medium text-sm truncate">{currentUser?.fullName || currentUser?.username}</p>
                <p className="text-dark-400 text-xs truncate">@{currentUser?.username}</p>
              </div>
              <Link
                to={`/profile/${currentUser?.username}`}
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-dark-300 hover:text-white hover:bg-white/5 text-sm transition-colors"
              >
                <Avatar user={currentUser} size="xs" />
                <span>View Profile</span>
              </Link>
              <Link
                to="/settings/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-dark-300 hover:text-white hover:bg-white/5 text-sm transition-colors"
              >
                <FiSettings size={16} />
                <span>Settings</span>
              </Link>
              <div className="border-t border-white/5 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 text-accent-red hover:bg-red-500/5 text-sm transition-colors w-full"
                >
                  <FiLogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
