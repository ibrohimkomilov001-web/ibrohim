'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'

/**
 * Sync filter state with URL search params.
 * Default values are omitted from the URL to keep it clean.
 *
 * Usage:
 *   const [filters, setFilters] = useUrlState({ search: '', tab: 'all' })
 *   setFilters({ search: 'telefon' })  // → ?search=telefon
 *   setFilters({ tab: 'active' })      // → ?search=telefon&tab=active
 *   setFilters({ search: '' })         // → ?tab=active  (default omitted)
 */
export function useUrlState<T extends Record<string, string>>(
  defaults: T,
): [T, (updates: Partial<T>) => void] {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const state = useMemo(() => {
    const result = { ...defaults }
    for (const key of Object.keys(defaults)) {
      const param = searchParams.get(key)
      if (param !== null) {
        (result as Record<string, string>)[key] = param
      }
    }
    return result
  }, [searchParams, defaults])

  const setState = useCallback(
    (updates: Partial<T>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === defaults[key]) {
          params.delete(key)
        } else {
          params.set(key, value as string)
        }
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [searchParams, router, pathname, defaults],
  )

  return [state, setState]
}
