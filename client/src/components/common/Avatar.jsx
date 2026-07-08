export default function Avatar({ user, size = 'md', showOnline = false, isOnline = false }) {
  const sizes = {
    xs:  'w-7 h-7 text-xs',
    sm:  'w-9 h-9 text-sm',
    md:  'w-11 h-11 text-base',
    lg:  'w-14 h-14 text-xl',
    xl:  'w-20 h-20 text-2xl',
    '2xl': 'w-28 h-28 text-3xl',
  }

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.username?.[0]?.toUpperCase() || '?'

  return (
    <div className="relative inline-flex shrink-0">
      {user?.avatar?.url ? (
        <img
          src={user.avatar.url}
          alt={user.username}
          className={`${sizes[size]} rounded-full object-cover ring-2 ring-white/10`}
        />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center font-bold text-white ring-2 ring-white/10`}>
          {initials}
        </div>
      )}
      {showOnline && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-dark-900 ${isOnline ? 'bg-accent-green' : 'bg-dark-500'}`} />
      )}
    </div>
  )
}
