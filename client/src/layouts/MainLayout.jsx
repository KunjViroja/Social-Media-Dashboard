import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Navbar from '../components/layout/Navbar'
import RightPanel from '../components/layout/RightPanel'
import { useSelector } from 'react-redux'
import { selectSidebarOpen } from '../redux/slices/uiSlice'

export default function MainLayout() {
  const sidebarOpen = useSelector(selectSidebarOpen)

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Navbar />
        <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6">
          {/* Center feed */}
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
          {/* Right panel (suggestions, trending hashtags) */}
          <RightPanel />
        </div>
      </main>
    </div>
  )
}
