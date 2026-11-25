import { useQuery } from '@tanstack/react-query'
import { Globe, KeyRound, Monitor, Moon, Sun, Tags } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { TagsManager } from '@/features/tags-manager'
import { query } from '@/lib/api'
import { c } from '@/lib/copy'
import { useThemeMode } from '@/lib/theme'
import { Badge, Button } from './ui'

const themes = [
  ['light', Sun, c.light],
  ['dark', Moon, c.dark],
  ['system', Monitor, c.system],
]

export function Shell() {
  const [tags, setTags] = useState(false)
  const { mode, setMode } = useThemeMode()
  const count = useQuery({ queryKey: ['count'], queryFn: () => query('/api/websites/count') })
  return (
    <>
      <header className="header">
        <NavLink to="/" className="brand">
          <span className="brand-mark">
            <Globe size={17} aria-hidden />
          </span>
          {c.app}
        </NavLink>
        <nav className="nav" aria-label={c.navigation}>
          <NavLink to="/" end>
            <Globe size={16} aria-hidden />
            {c.websites}
            {count.data && (
              <Badge>
                <span data-testid="website-count">
                  {count.data.count > 9999 ? '9999+' : count.data.count}
                </span>
              </Badge>
            )}
          </NavLink>
          <NavLink to="/accounts">
            <KeyRound size={16} aria-hidden />
            {c.accounts}
          </NavLink>
        </nav>
        <div className="header-end">
          <Button size="sm" onClick={() => setTags(true)}>
            <Tags size={15} aria-hidden />
            <span className="hide-sm">{c.tags}</span>
          </Button>
          <fieldset className="segmented">
            <legend className="sr-only">{c.theme}</legend>
            {themes.map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                aria-label={label}
                title={label}
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
              >
                <Icon size={15} />
              </button>
            ))}
          </fieldset>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      {tags && <TagsManager onClose={() => setTags(false)} />}
    </>
  )
}

export function PageHead({ title, intro, children }) {
  return (
    <div className="page-head row between" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      {children}
    </div>
  )
}
