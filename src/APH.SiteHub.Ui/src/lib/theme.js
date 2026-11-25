import { useEffect, useState } from 'react'

export const THEME_KEY = 'sitehub-theme'
const modes = ['light', 'dark', 'system']

function readMode() {
  try {
    const value = localStorage.getItem(THEME_KEY)
    return modes.includes(value) ? value : 'system'
  } catch {
    return 'system'
  }
}

// Keep in sync with the pre-paint script in index.html.
function applyMode(mode) {
  const dark =
    mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  const root = document.documentElement
  root.dataset.theme = dark ? 'dark' : 'light'
  root.style.colorScheme = dark ? 'dark' : 'light'
}

export function useThemeMode() {
  const [mode, setState] = useState(readMode)
  useEffect(() => {
    applyMode(mode)
    if (mode !== 'system') return
    const media = matchMedia('(prefers-color-scheme: dark)')
    const listener = () => applyMode('system')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [mode])
  const setMode = (next) => {
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {}
    setState(next)
  }
  return { mode, setMode }
}
