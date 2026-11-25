import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export const THEME_KEY = 'sitehub-theme'
const modes: ThemeMode[] = ['light', 'dark', 'system']

function readMode(): ThemeMode {
  try {
    const value = localStorage.getItem(THEME_KEY) as ThemeMode | null
    return value && modes.includes(value) ? value : 'system'
  } catch {
    return 'system'
  }
}

function applyMode(mode: ThemeMode) {
  const dark =
    mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  const root = document.documentElement
  root.dataset.theme = dark ? 'sitehub-dark' : 'sitehub-light'
  root.classList.toggle('dark', dark)
  root.classList.toggle('light', !dark)
  root.style.colorScheme = dark ? 'dark' : 'light'
}

export function useThemeMode() {
  const [mode, setState] = useState<ThemeMode | null>(null)
  useEffect(() => setState(readMode()), [])
  useEffect(() => {
    if (!mode) return
    applyMode(mode)
    if (mode !== 'system') return
    const media = matchMedia('(prefers-color-scheme: dark)')
    const listener = () => applyMode('system')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [mode])
  const setMode = (next: ThemeMode) => {
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {}
    setState(next)
  }
  return { mode: mode ?? 'system', setMode }
}
