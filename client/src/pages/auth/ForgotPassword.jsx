import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FiMail, FiArrowLeft, FiLoader, FiCheckCircle } from 'react-icons/fi'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [loading, setLoading]   = useState(false)
  const [sent,    setSent]      = useState(false)
  const [email,   setEmailSent] = useState('')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', data)
      setEmailSent(data.email)
      setSent(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="glass-dark rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-accent-green/10 flex items-center justify-center mx-auto mb-4">
          <FiCheckCircle size={32} className="text-accent-green" />
        </div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">Check your inbox</h2>
        <p className="text-dark-400 text-sm leading-relaxed mb-6">
          We've sent a password reset link to{' '}
          <span className="text-white font-medium">{email}</span>. The link expires in 1 hour.
        </p>
        <p className="text-dark-500 text-xs mb-6">
          Didn't receive it? Check your spam folder, or{' '}
          <button
            onClick={() => setSent(false)}
            className="text-primary-400 hover:text-primary-300 underline"
          >
            try again
          </button>
          .
        </p>
        <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2 py-3">
          Back to Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="glass-dark rounded-3xl p-8 border border-white/10 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-white mb-2">Forgot Password</h2>
        <p className="text-dark-400 text-sm">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 block">
            Email Address
          </label>
          <div className="relative">
            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
            <input
              type="email"
              placeholder="name@example.com"
              {...register('email', { required: 'Email is required' })}
              className="input-dark pl-11"
            />
          </div>
          {errors.email && (
            <span className="text-xs text-accent-red mt-1 block">{errors.email.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? <FiLoader className="animate-spin" size={16} /> : <FiMail size={16} />}
          <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
        </button>
      </form>

      <div className="text-center mt-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-dark-400 hover:text-white text-sm transition-colors"
        >
          <FiArrowLeft size={14} />
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}
