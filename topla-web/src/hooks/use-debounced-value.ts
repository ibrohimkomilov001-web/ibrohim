'use client'

import { useState, useEffect } from 'react'

/**
 * Returns a debounced version of the value.
 * Updates only after `delay` ms of no changes.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
