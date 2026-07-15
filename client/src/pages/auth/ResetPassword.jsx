import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FiLock, FiEye, FiEyeOff, FiLoader, FiCheckCircle } from 'react-icons/fi'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const { token }    = useParams()
  const navigate     = useNavigate()
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [showPw,   setShowPw]   = useState(false)
  const [showConf, setShowConf] = useState(false)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.post(`/auth/reset-password/${token}`, { password: data.password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired reset link.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="glass-dark rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-accent-green/10 flex items-center justify-center mx-auto mb-4">
          <FiCheckCircle size={32} className="text-accent-green" />
        </div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">Password Reset!</h2>
        <p className="text-dark-400 text-sm mb-6">
          Your password has been updated. Redirecting to login in a few seconds...
        </p>
        <Link to="/login" className="btn-primary w-full flex items-center justify-center py-3">
          Go to Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="glass-dark rounded-3xl p-8 border border-white/10 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-white mb-2">Reset Password</h2>
        <p className="text-dark-400 text-sm">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New password */}
        <div>
          <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 block">
            New Password
          </label>
          <div className="relative">
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
              })}
              className="input-dark pl-11 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
            >
              {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
          {errors.password && (
            <span className="text-xs text-accent-red mt-1 block">{errors.password.message}</span>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 block">
            Confirm Password
          </label>
          <div className="relative">
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
            <input
              type={showConf ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) => val === watch('password') || 'Passwords do not match',
              })}
              className="input-dark pl-11 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowConf((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
            >
              {showConf ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="text-xs text-accent-red mt-1 block">{errors.confirmPassword.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? <FiLoader className="animate-spin" size={16} /> : <FiLock size={16} />}
          <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
        </button>
      </form>

      <div className="text-center mt-6">
        <Link to="/login" className="text-dark-400 hover:text-white text-sm transition-colors">
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}
