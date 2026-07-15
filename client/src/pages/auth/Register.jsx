import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FiUser, FiMail, FiLock, FiLoader } from 'react-icons/fi'
import { useDispatch } from 'react-redux'
import { registerUser } from '../../redux/slices/authSlice'
import toast from 'react-hot-toast'

export default function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await dispatch(registerUser(data)).unwrap()
      toast.success('Registration successful! Please check your email for verification.')
      navigate('/login')
    } catch (err) {
      toast.error(err || 'Failed to register')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-dark rounded-3xl p-8 border border-white/10 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-white mb-2">Create Account</h2>
        <p className="text-dark-400 text-sm">Join SocialHub and connect with peers</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 block">Username</label>
          <div className="relative">
            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
            <input
              type="text"
              placeholder="johndoe"
              {...register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Username must be at least 3 characters' },
                pattern: { value: /^[a-z0-9_]+$/, message: 'Lowercase and numbers/underscores only' }
              })}
              className="input-dark pl-11"
            />
          </div>
          {errors.username && <span className="text-xs text-accent-red mt-1 block">{errors.username.message}</span>}
        </div>

        <div>
          <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 block">Full Name</label>
          <div className="relative">
            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
            <input
              type="text"
              placeholder="John Doe"
              {...register('fullName', { required: 'Full Name is required' })}
              className="input-dark pl-11"
            />
          </div>
          {errors.fullName && <span className="text-xs text-accent-red mt-1 block">{errors.fullName.message}</span>}
        </div>

        <div>
          <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 block">Email Address</label>
          <div className="relative">
            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
            <input
              type="email"
              placeholder="john@example.com"
              {...register('email', { required: 'Email is required' })}
              className="input-dark pl-11"
            />
          </div>
          {errors.email && <span className="text-xs text-accent-red mt-1 block">{errors.email.message}</span>}
        </div>

        <div>
          <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 block">Password</label>
          <div className="relative">
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
            <input
              type="password"
              placeholder="••••••••"
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
              className="input-dark pl-11"
            />
          </div>
          {errors.password && <span className="text-xs text-accent-red mt-1 block">{errors.password.message}</span>}
        </div>

        <button type="submit" disabled={loading} className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2">
          {loading ? <FiLoader className="animate-spin" size={16} /> : null}
          <span>Sign Up</span>
        </button>
      </form>

      <div className="text-center mt-6">
        <span className="text-dark-400 text-sm">Already have an account? </span>
        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold text-sm">Sign In</Link>
      </div>
    </div>
  )
}
