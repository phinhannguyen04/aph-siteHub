import { useSyncExternalStore } from 'react'
import { Toaster as Sonner } from 'sonner'

// Follows the app theme (`data-theme` on <html>, set by lib/theme.js) instead of next-themes.
function subscribe(callback) {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}
const snapshot = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

function Toaster(props) {
  const theme = useSyncExternalStore(subscribe, snapshot, () => 'light')
  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      duration={4000}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'toast flex w-[min(360px,calc(100vw-1.5rem))] items-center gap-2 rounded-md bg-[var(--surface-base)] px-3 py-2 text-[var(--text-inverse)] shadow-[var(--shadow-popup)] data-[type=error]:bg-destructive',
          title: 'flex-1 text-sm font-semibold',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
