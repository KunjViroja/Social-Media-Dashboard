import { useState, useEffect, useRef } from 'react'

/**
 * useInfiniteScroll — triggers callback when sentinel element is in view
 * @param {Function} callback - function to call when bottom is reached
 * @param {boolean} hasMore - whether more data is available
 * @param {boolean} isLoading - prevent double-firing while loading
 */
const useInfiniteScroll = (callback, hasMore, isLoading) => {
  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!hasMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback()
        }
      },
      { threshold: 0.1 }
    )

    if (sentinelRef.current) observer.observe(sentinelRef.current)

    return () => observer.disconnect()
  }, [callback, hasMore, isLoading])

  return sentinelRef
}

export default useInfiniteScroll
