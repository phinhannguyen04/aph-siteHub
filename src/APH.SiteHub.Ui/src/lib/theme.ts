'use client'
import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export const THEME_KEY = 'sitehub-theme'
const modes: ThemeMode[] = ['light', 'dark', 'system']

// Runs before hydration so the stored preference is applied without a flash of the wrong theme.
export const themeScript = `(function(){try{var m=localStorage.getItem('${THEME_KEY}');if(m!=='light'&&m!=='dark')m='system';var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.dataset.theme=d?'sitehub-dark':'sitehub-light';e.classList.toggle('dark',d);e.classList.toggle('light',!d);e.style.colorScheme=d?'dark':'light'}catch(_){}})()`

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
