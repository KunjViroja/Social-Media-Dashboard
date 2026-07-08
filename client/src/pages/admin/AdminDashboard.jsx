import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import Avatar from '../../components/common/Avatar'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users')
        setUsers(res.users || [])
      } catch (err) {
        toast.error('Failed to load admin users list')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const handleBlockToggle = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/block`)
      toast.success(res.message)
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isBlocked: res.data.isBlocked } : u))
      )
    } catch {
      toast.error('Failed to toggle block status')
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Admin Control Panel</h1>
        <p className="text-dark-400 text-sm">Manage user accounts and moderate content platform-wide</p>
      </div>

      <div className="glass-dark rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="text-white font-semibold">Platform Users</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-dark-400">Loading user registry...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-dark-300 font-semibold uppercase text-xs tracking-wider">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <Avatar user={u} size="xs" />
                      <div>
                        <p className="text-white font-medium">{u.fullName || u.username}</p>
                        <p className="text-dark-400 text-xs">@{u.username}</p>
                      </div>
                    </td>
                    <td className="p-4 text-white capitalize">{u.role}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.isBlocked ? 'bg-red-500/10 text-accent-red' : 'bg-green-500/10 text-accent-green'}`}>
                        {u.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleBlockToggle(u._id)}
                          className={`btn-ghost !px-3 !py-1 text-xs ${u.isBlocked ? 'text-accent-green hover:bg-green-500/10' : 'text-accent-red hover:bg-red-500/10'}`}
                        >
                          {u.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
