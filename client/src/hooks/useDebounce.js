import { useState, useEffect } from 'react'

/**
 * useDebounce — delays updating a value until user stops typing
 * @param {any} value - value to debounce
 * @param {number} delay - ms delay (default 400ms)
 */
const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export default useDebounce
