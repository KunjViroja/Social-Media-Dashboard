import { Outlet, Link, useLocation } from 'react-router-dom'
import { FiBarChart2, FiUsers, FiFileText, FiHome } from 'react-icons/fi'

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: FiBarChart2, exact: true },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
  { to: '/admin/posts', label: 'Posts', icon: FiFileText },
]

export default function AdminLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-dark-900 border-r border-white/5 flex flex-col fixed h-full">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Admin Panel</p>
              <p className="text-dark-400 text-xs">SocialHub</p>
            </div>
          </div>
        </div>

        <nav className="p-4 flex-1 space-y-1">
          {adminLinks.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to) && to !== '/admin'
            return (
              <Link key={to} to={to} className={`nav-item ${active ? 'active' : ''}`}>
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Link to="/" className="nav-item">
            <FiHome size={18} />
            <span>Back to App</span>
          </Link>
        </div>
      </aside>

      {/* Admin Content */}
      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}
