import React, { useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { FiCamera, FiUser, FiMapPin, FiLink, FiSave, FiLoader } from 'react-icons/fi'
import { selectCurrentUser, updateUser } from '../../redux/slices/authSlice'
import userService from '../../services/user.service'
import Avatar from '../../components/common/Avatar'
import toast from 'react-hot-toast'

export default function EditProfile() {
  const dispatch    = useDispatch()
  const currentUser = useSelector(selectCurrentUser)

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      fullName: currentUser?.fullName  || '',
      bio:      currentUser?.bio       || '',
      location: currentUser?.location  || '',
      website:  currentUser?.website   || '',
    },
  })

  const [saving,        setSaving]        = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [coverPreview,  setCoverPreview]  = useState(null)
  const avatarRef = useRef()
  const coverRef  = useRef()

  // ── Avatar upload ─────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))

    const formData = new FormData()
    formData.append('avatar', file)
    try {
      const res = await userService.uploadAvatar(formData)
      dispatch(updateUser({ avatar: res.avatar }))
      toast.success('Profile picture updated!')
    } catch {
      toast.error('Failed to upload avatar')
    }
  }

  // ── Cover upload ──────────────────────────────
  const handleCoverChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCoverPreview(URL.createObjectURL(file))

    const formData = new FormData()
    formData.append('cover', file)
    try {
      const res = await userService.uploadCover(formData)
      dispatch(updateUser({ coverImage: res.coverImage }))
      toast.success('Cover photo updated!')
    } catch {
      toast.error('Failed to upload cover')
    }
  }

  // ── Save profile ──────────────────────────────
  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const res = await userService.updateProfile(data)
      dispatch(updateUser(res.user || data))
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
        <p className="text-dark-400 text-sm mt-0.5">Update your profile information and photos</p>
      </div>

      {/* Cover + Avatar card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark rounded-3xl border border-white/5 overflow-hidden"
      >
        {/* Cover image */}
        <div className="relative h-44 group">
          {coverPreview || currentUser?.coverImage?.url ? (
            <img
              src={coverPreview || currentUser?.coverImage?.url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary-600 to-accent-violet" />
          )}
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={() => coverRef.current?.click()}
              className="flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors backdrop-blur-sm"
            >
              <FiCamera size={16} />
              Change Cover
            </button>
          </div>
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="hidden"
          />
        </div>

        {/* Avatar */}
        <div className="px-6 pb-6">
          <div className="relative -mt-16 w-fit group">
            <Avatar
              user={avatarPreview ? { ...currentUser, avatar: { url: avatarPreview } } : currentUser}
              size="2xl"
            />
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <FiCamera size={20} className="text-white" />
            </button>
            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>
      </motion.div>

      {/* Profile form */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit(onSubmit)}
        className="glass-dark rounded-3xl border border-white/5 p-6 space-y-5"
      >
        <h2 className="text-white font-semibold text-lg">Profile Information</h2>

        {/* Full Name */}
        <div>
          <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 block">
            Full Name
          </label>
          <div className="relative">
            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
            <input
              type="text"
              placeholder="Your full name"
              {...register('fullName', { required: 'Full name is required' })}
              className="input-dark pl-11"
            />
          </div>
          {errors.fullName && (
            <span className="text-xs text-accent-red mt-1 block">{errors.fullName.message}</span>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 block">
            Bio
          </label>
          <textarea
            placeholder="Tell people about yourself..."
            {...register('bio', { maxLength: { value: 200, message: 'Max 200 characters' } })}
            rows={3}
            className="input-dark resize-none"
          />
          {errors.bio && (
            <span className="text-xs text-accent-red mt-1 block">{errors.bio.message}</span>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 block">
            Location
          </label>
          <div className="relative">
            <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
            <input
              type="text"
              placeholder="City, Country"
              {...register('location', { maxLength: { value: 100, message: 'Max 100 characters' } })}
              className="input-dark pl-11"
            />
          </div>
        </div>

        {/* Website */}
        <div>
          <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 block">
            Website
          </label>
          <div className="relative">
            <FiLink className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
            <input
              type="url"
              placeholder="https://yourwebsite.com"
              {...register('website', {
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Must start with http:// or https://',
                },
              })}
              className="input-dark pl-11"
            />
          </div>
          {errors.website && (
            <span className="text-xs text-accent-red mt-1 block">{errors.website.message}</span>
          )}
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <FiLoader className="animate-spin" size={16} /> : <FiSave size={16} />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </motion.form>
    </div>
  )
}
