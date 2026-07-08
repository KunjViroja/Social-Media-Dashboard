import { useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCurrentUser } from './redux/slices/authSlice'
import { selectIsAuthenticated, selectIsInitialized } from './redux/slices/authSlice'
import { SocketProvider } from './context/SocketContext'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import AdminLayout from './layouts/AdminLayout'
import PageLoader from './components/common/PageLoader'

// Lazy load pages for code splitting
const Login      = lazy(() => import('./pages/auth/Login'))
const Register   = lazy(() => import('./pages/auth/Register'))
const ForgotPass = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPass  = lazy(() => import('./pages/auth/ResetPassword'))
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'))

const Feed         = lazy(() => import('./pages/home/Feed'))
const Trending     = lazy(() => import('./pages/home/Trending'))
const Profile      = lazy(() => import('./pages/profile/Profile'))
const EditProfile  = lazy(() => import('./pages/profile/EditProfile'))
const Messages     = lazy(() => import('./pages/messages/Messages'))
const Notifications = lazy(() => import('./pages/notifications/Notifications'))
const Search       = lazy(() => import('./pages/search/Search'))
const Bookmarks    = lazy(() => import('./pages/home/Bookmarks'))
const Analytics    = lazy(() => import('./pages/analytics/Analytics'))

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers     = lazy(() => import('./pages/admin/AdminUsers'))
const AdminPosts     = lazy(() => import('./pages/admin/AdminPosts'))

// ── Protected Route Guard ──────────────────────
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isInitialized = useSelector(selectIsInitialized)

  if (!isInitialized) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

// ── Admin Route Guard ──────────────────────────
const AdminRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user)
  const isInitialized = useSelector(selectIsInitialized)

  if (!isInitialized) return <PageLoader />
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

// ── Guest Route Guard ──────────────────────────
const GuestRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isInitialized = useSelector(selectIsInitialized)

  if (!isInitialized) return <PageLoader />
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}

// ── Main App ───────────────────────────────────
export default function App() {
  const dispatch = useDispatch()

  // Restore session on page load
  useEffect(() => {
    dispatch(fetchCurrentUser())
  }, [dispatch])

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPass /></GuestRoute>} />
          <Route path="/reset-password/:token" element={<GuestRoute><ResetPass /></GuestRoute>} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
        </Route>

        {/* Main app routes */}
        <Route element={<ProtectedRoute><SocketProvider><MainLayout /></SocketProvider></ProtectedRoute>}>
          <Route path="/"              element={<Feed />} />
          <Route path="/trending"      element={<Trending />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/settings/profile"  element={<EditProfile />} />
          <Route path="/messages"      element={<Messages />} />
          <Route path="/messages/:id"  element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/search"        element={<Search />} />
          <Route path="/bookmarks"     element={<Bookmarks />} />
          <Route path="/analytics"     element={<Analytics />} />
        </Route>

        {/* Admin routes */}
        <Route element={<AdminRoute><SocketProvider><AdminLayout /></SocketProvider></AdminRoute>}>
          <Route path="/admin"         element={<AdminDashboard />} />
          <Route path="/admin/users"   element={<AdminUsers />} />
          <Route path="/admin/posts"   element={<AdminPosts />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
