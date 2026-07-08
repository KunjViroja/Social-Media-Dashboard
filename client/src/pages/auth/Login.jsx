import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FiMail, FiLock, FiLoader } from 'react-icons/fi'
import { useDispatch } from 'react-redux'
import { loginUser } from '../../redux/slices/authSlice'
import toast from 'react-hot-toast'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await dispatch(loginUser(data)).unwrap()
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-dark rounded-3xl p-8 border border-white/10 shadow-2xl">
      <div className="text-center mb-8 lg:hidden">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center glow-primary mx-auto mb-3">
          <span className="text-white text-xl font-bold">S</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-white">SocialHub</h1>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-white mb-2">Sign In</h2>
        <p className="text-dark-400 text-sm">Enter your credentials to access your dashboard</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 block">Email Address</label>
          <div className="relative">
            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
            <input
              type="email"
              placeholder="name@example.com"
              {...register('email', { required: 'Email is required' })}
              className="input-dark pl-11"
            />
          </div>
          {errors.email && <span className="text-xs text-accent-red mt-1 block">{errors.email.message}</span>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider block">Password</label>
            <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 font-medium">Forgot?</Link>
          </div>
          <div className="relative">
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
            <input
              type="password"
              placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
              className="input-dark pl-11"
            />
          </div>
          {errors.password && <span className="text-xs text-accent-red mt-1 block">{errors.password.message}</span>}
        </div>

        <button type="submit" disabled={loading} className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2">
          {loading ? <FiLoader className="animate-spin" size={16} /> : null}
          <span>Sign In</span>
        </button>
      </form>

      <div className="text-center mt-6">
        <span className="text-dark-400 text-sm">Don't have an account? </span>
        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold text-sm">Create account</Link>
      </div>
    </div>
  )
}
