import React, { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../services/api'
import { FiUsers, FiHeart, FiFileText, FiMessageSquare } from 'react-icons/fi'

export default function Analytics() {
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const statsRes = await api.get('/analytics/overview')
        setStats(statsRes)

        const engagementRes = await api.get('/analytics/engagement')
        setChartData(engagementRes.weekly || [])
      } catch {}
    }
    fetchAnalytics()
  }, [])

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: FiUsers, color: 'text-primary-400' },
    { label: 'Total Posts', value: stats?.totalPosts || 0, icon: FiFileText, color: 'text-accent-pink' },
    { label: 'Likes Gained', value: stats?.totalLikes || 0, icon: FiHeart, color: 'text-accent-amber' },
    { label: 'Messages Sent', value: stats?.totalMessages || 0, icon: FiMessageSquare, color: 'text-accent-cyan' },
  ]

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-dark-400 text-sm">Real-time engagement and growth metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="glass-dark rounded-2xl p-5 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`p-3 bg-white/5 rounded-xl ${card.color}`}>
                <Icon size={20} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Engagement Chart */}
      <div className="glass-dark rounded-3xl p-6 border border-white/5">
        <h3 className="text-white font-semibold mb-6">Weekly Engagement Trends</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="likes" stroke="#6366f1" fillOpacity={1} fill="url(#colorLikes)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
