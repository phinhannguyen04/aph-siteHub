import { useSyncExternalStore } from 'react'

const mobileQuery = '(max-width: 860px)'

/** True below the breakpoint where the sidebar becomes a drawer. */
export function useMobile() {
  return useSyncExternalStore(
    (notify) => {
      const media = matchMedia(mobileQuery)
      media.addEventListener('change', notify)
      return () => media.removeEventListener('change', notify)
    },
    () => matchMedia(mobileQuery).matches,
    () => false,
  )
}
