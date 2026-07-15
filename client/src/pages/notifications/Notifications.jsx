import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiBell, FiHeart, FiMessageCircle, FiUserPlus, FiCheck, FiTrash2 } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import {
  setNotifications,
  appendNotifications,
  markRead,
  markAllRead,
  selectNotifications,
  selectUnreadCount,
} from '../../redux/slices/notificationSlice'
import notificationService from '../../services/notification.service'
import Avatar from '../../components/common/Avatar'
import toast from 'react-hot-toast'

const TYPE_ICON = {
  like:    { Icon: FiHeart,        color: 'text-accent-pink',    bg: 'bg-accent-pink/10' },
  comment: { Icon: FiMessageCircle, color: 'text-primary-400',   bg: 'bg-primary-400/10' },
  follow:  { Icon: FiUserPlus,     color: 'text-accent-green',   bg: 'bg-accent-green/10' },
  mention: { Icon: FiMessageCircle, color: 'text-accent-cyan',   bg: 'bg-accent-cyan/10' },
}

export default function Notifications() {
  const dispatch  = useDispatch()
  const items     = useSelector(selectNotifications)
  const unread    = useSelector(selectUnreadCount)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchNotifications = async (pg = 1) => {
    try {
      const res = await notificationService.getNotifications({ page: pg, limit: 20 })
      if (pg === 1) {
        dispatch(setNotifications({
          notifications: res.notifications || [],
          unreadCount: res.unreadCount || 0,
        }))
      } else {
        dispatch(appendNotifications({
          notifications: res.notifications || [],
          pagination: res.pagination,
        }))
      }
      setHasMore(res.pagination?.hasNextPage || false)
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications(1)
  }, [])

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
      dispatch(markRead(id))
    } catch {}
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      dispatch(markAllRead())
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id)
      dispatch(setNotifications({
        notifications: items.filter((n) => n._id !== id),
        unreadCount: Math.max(0, unread - (items.find((n) => n._id === id)?.isRead ? 0 : 1)),
      }))
    } catch {}
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchNotifications(next)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {unread > 0 && (
            <p className="text-dark-400 text-sm mt-0.5">{unread} unread</p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn-ghost !px-4 !py-2 flex items-center gap-2 text-sm"
          >
            <FiCheck size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="glass-dark rounded-2xl p-4 h-20 skeleton" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-3xl p-16 border border-white/5 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
            <FiBell size={28} className="text-primary-400" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">All caught up!</h3>
          <p className="text-dark-400 text-sm">You have no notifications yet. Interact with posts to get started.</p>
        </motion.div>
      )}

      {/* Notification list */}
      <AnimatePresence initial={false}>
        {items.map((notif, i) => {
          const config = TYPE_ICON[notif.type] || TYPE_ICON.like
          const Icon   = config.Icon

          return (
            <motion.div
              key={notif._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.03 }}
              className={`glass-dark rounded-2xl p-4 border transition-all duration-200 group ${
                notif.isRead
                  ? 'border-white/5'
                  : 'border-primary-500/20 bg-primary-500/5'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Sender avatar */}
                <div className="relative shrink-0">
                  {notif.sender ? (
                    <Link to={`/profile/${notif.sender.username}`}>
                      <Avatar user={notif.sender} size="sm" />
                    </Link>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center">
                      <FiBell size={16} className="text-dark-400" />
                    </div>
                  )}
                  {/* Type icon badge */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center ${config.bg}`}>
                    <Icon size={10} className={config.color} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/90 leading-relaxed">
                    {notif.sender && (
                      <Link
                        to={`/profile/${notif.sender.username}`}
                        className="font-semibold hover:underline mr-1"
                      >
                        {notif.sender.fullName || notif.sender.username}
                      </Link>
                    )}
                    {notif.text || notif.message}
                  </p>
                  <p className="text-xs text-dark-400 mt-1">
                    {notif.createdAt
                      ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })
                      : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkRead(notif._id)}
                      title="Mark as read"
                      className="p-1.5 rounded-lg hover:bg-white/5 text-dark-400 hover:text-primary-400 transition-colors"
                    >
                      <FiCheck size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif._id)}
                    title="Delete"
                    className="p-1.5 rounded-lg hover:bg-white/5 text-dark-400 hover:text-accent-red transition-colors"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Load more */}
      {!loading && hasMore && (
        <div className="text-center pt-2">
          <button onClick={loadMore} className="btn-ghost !px-6">
            Load more
          </button>
        </div>
      )}
    </div>
  )
}
