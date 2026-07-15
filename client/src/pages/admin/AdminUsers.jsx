import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSearch, FiShield, FiUser, FiLoader } from 'react-icons/fi'
import api from '../../services/api'
import Avatar from '../../components/common/Avatar'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState('all')
  const [page,    setPage]    = useState(1)
  const [pagination, setPagination] = useState({})

  const fetchUsers = async (pg = 1) => {
    setLoading(true)
    try {
      const params = { page: pg, limit: 20 }
      if (search.trim()) params.search = search.trim()
      if (status !== 'all') params.status = status

      const res = await api.get('/admin/users', { params })
      setUsers(res.users || [])
      setPagination(res.pagination || {})
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(page)
  }, [page, status])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchUsers(1)
  }

  const handleBlockToggle = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/block`)
      toast.success(res.message || 'Status updated')
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isBlocked: res.data?.isBlocked ?? !u.isBlocked } : u))
      )
    } catch {
      toast.error('Failed to update user status')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <FiUser className="text-primary-400" size={18} />
          </div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
        </div>
        <p className="text-dark-400 text-sm">
          Manage all registered users — {pagination.total || 0} total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark pl-11 pr-4"
          />
        </form>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="input-dark w-full sm:w-44"
        >
          <option value="all">All Users</option>
          <option value="blocked">Blocked</option>
          <option value="verified">Verified</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-dark rounded-3xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <FiLoader size={28} className="text-primary-400 animate-spin mx-auto mb-3" />
            <p className="text-dark-400 text-sm">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-dark-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-dark-300 font-semibold uppercase text-xs tracking-wider">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Posts</th>
                  <th className="p-4">Followers</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <motion.tr
                    key={u._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar user={u} size="xs" />
                        <div>
                          <p className="text-white font-medium">{u.fullName || u.username}</p>
                          <p className="text-dark-400 text-xs">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`flex items-center gap-1.5 w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        u.role === 'admin'
                          ? 'bg-accent-violet/10 text-accent-violet'
                          : 'bg-white/5 text-dark-300'
                      }`}>
                        {u.role === 'admin' && <FiShield size={11} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-white">{u.postsCount || 0}</td>
                    <td className="p-4 text-white">{u.followersCount || 0}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        u.isBlocked
                          ? 'bg-red-500/10 text-accent-red'
                          : 'bg-green-500/10 text-accent-green'
                      }`}>
                        {u.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleBlockToggle(u._id)}
                          className={`btn-ghost !px-3 !py-1 text-xs ${
                            u.isBlocked
                              ? 'text-accent-green hover:bg-green-500/10'
                              : 'text-accent-red hover:bg-red-500/10'
                          }`}
                        >
                          {u.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-dark-400 text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost !px-4 !py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="btn-ghost !px-4 !py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
