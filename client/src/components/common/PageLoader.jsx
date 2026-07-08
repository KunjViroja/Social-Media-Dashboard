import { motion } from 'framer-motion'

export default function PageLoader() {
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary-500 to-accent-violet opacity-20 animate-pulse" />
        </div>
        <p className="text-dark-400 text-sm font-medium">Loading SocialHub...</p>
      </motion.div>
    </div>
  )
}
