/**
 * components/layout/Sidebar.jsx — Main Navigation Sidebar
 */
import { Link, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiHome, FiTrendingUp, FiMessageSquare, FiBell, FiSearch, FiBookmark, FiBarChart2, FiSettings, FiMenu, FiX, FiShield } from 'react-icons/fi'
import { toggleSidebar, selectSidebarOpen } from '../../redux/slices/uiSlice'
import { selectCurrentUser } from '../../redux/slices/authSlice'
import { selectUnreadCount } from '../../redux/slices/notificationSlice'
import Avatar from '../common/Avatar'

const navLinks = [
  { to: '/', icon: FiHome, label: 'Home' },
  { to: '/trending', icon: FiTrendingUp, label: 'Trending' },
  { to: '/search', icon: FiSearch, label: 'Search' },
  { to: '/messages', icon: FiMessageSquare, label: 'Messages' },
  { to: '/notifications', icon: FiBell, label: 'Notifications', badge: true },
  { to: '/bookmarks', icon: FiBookmark, label: 'Bookmarks' },
  { to: '/analytics', icon: FiBarChart2, label: 'Analytics' },
]

export default function Sidebar() {
  const dispatch = useDispatch()
  const location = useLocation()
  const sidebarOpen = useSelector(selectSidebarOpen)
  const currentUser = useSelector(selectCurrentUser)
  const unreadCount = useSelector(selectUnreadCount)

  const isActive = (to) => location.pathname === to

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 256 : 80 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full bg-dark-900/80 backdrop-blur-xl border-r border-white/5 flex flex-col z-30 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 h-16">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center glow-primary shrink-0">
                <span className="text-white text-sm font-bold">S</span>
              </div>
              <span className="text-white font-display font-bold text-lg gradient-text">SocialHub</span>
            </motion.div>
          )}
        </AnimatePresence>
        {!sidebarOpen && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center mx-auto">
            <span className="text-white text-sm font-bold">S</span>
          </div>
        )}
        {sidebarOpen && (
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <FiX size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
        {navLinks.map(({ to, icon: Icon, label, badge }) => (
          <Link
            key={to}
            to={to}
            className={`nav-item relative ${isActive(to) ? 'active' : ''} ${!sidebarOpen ? 'justify-center' : ''}`}
            title={!sidebarOpen ? label : undefined}
          >
            <div className="relative shrink-0">
              <Icon size={20} />
              {badge && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 badge text-[10px] min-w-[16px] h-4">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        ))}

        {/* Admin link (only for admins) */}
        {currentUser?.role === 'admin' && (
          <Link
            to="/admin"
            className={`nav-item ${location.pathname.startsWith('/admin') ? 'active' : ''} ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <FiShield size={20} className="shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Admin</span>}
          </Link>
        )}
      </nav>

      {/* Toggle Button (when collapsed) */}
      {!sidebarOpen && (
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-4 text-dark-400 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
        >
          <FiMenu size={20} />
        </button>
      )}

      {/* User Profile at Bottom */}
      {currentUser && (
        <Link
          to={`/profile/${currentUser.username}`}
          className={`flex items-center gap-3 p-4 border-t border-white/5 hover:bg-white/5 transition-colors ${!sidebarOpen ? 'justify-center' : ''}`}
        >
          <Avatar user={currentUser} size="sm" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-white text-sm font-medium truncate">{currentUser.fullName || currentUser.username}</p>
                <p className="text-dark-400 text-xs truncate">@{currentUser.username}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      )}
    </motion.aside>
  )
}
