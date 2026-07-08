import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-dark-950 overflow-hidden">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-dark-950 to-dark-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-violet/10 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 max-w-md text-center"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center glow-primary">
              <span className="text-white text-xl font-bold">S</span>
            </div>
            <h1 className="text-3xl font-display font-bold gradient-text">SocialHub</h1>
          </div>

          <h2 className="text-4xl font-display font-bold text-white mb-6 leading-tight">
            Connect. Share. <br />
            <span className="gradient-text">Engage.</span>
          </h2>

          <p className="text-dark-300 text-lg leading-relaxed mb-10">
            A modern social platform with real-time messaging, live notifications, and powerful analytics.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 justify-center">
            {['Real-time Chat', 'Live Notifications', 'Analytics', 'Rich Profiles'].map((f) => (
              <span key={f} className="px-4 py-1.5 rounded-full text-sm font-medium glass text-primary-300 border border-primary-500/20">
                {f}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  )
}
