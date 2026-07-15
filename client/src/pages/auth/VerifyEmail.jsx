import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi'
import api from '../../services/api'

export default function VerifyEmail() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify-email/${token}`)
        setMessage(res.message || 'Email verified successfully!')
        setStatus('success')
      } catch (err) {
        setMessage(err.response?.data?.message || 'This verification link is invalid or has expired.')
        setStatus('error')
      }
    }
    if (token) verify()
    else setStatus('error')
  }, [token])

  return (
    <div className="glass-dark rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
      {status === 'loading' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center">
            <FiLoader size={32} className="text-primary-400 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-white">Verifying your email...</h2>
          <p className="text-dark-400 text-sm">Please wait a moment.</p>
        </motion.div>
      )}

      {status === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-accent-green/10 flex items-center justify-center">
            <FiCheckCircle size={32} className="text-accent-green" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white">Email Verified!</h2>
          <p className="text-dark-400 text-sm leading-relaxed">{message}</p>
          <Link to="/login" className="btn-primary w-full py-3 flex items-center justify-center mt-2">
            Sign In to Your Account
          </Link>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-accent-red/10 flex items-center justify-center">
            <FiXCircle size={32} className="text-accent-red" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white">Verification Failed</h2>
          <p className="text-dark-400 text-sm leading-relaxed">{message}</p>
          <div className="flex flex-col gap-3 w-full mt-2">
            <Link to="/register" className="btn-primary w-full py-3 flex items-center justify-center">
              Create a New Account
            </Link>
            <Link to="/login" className="btn-ghost w-full py-3 flex items-center justify-center">
              Back to Sign In
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
