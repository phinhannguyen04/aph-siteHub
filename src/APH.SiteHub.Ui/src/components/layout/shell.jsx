import { Dialog } from '@base-ui/react/dialog'
import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { useQuery } from '@tanstack/react-query'
import {
  Globe,
  KeyRound,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Tags,
} from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { Badge, Button, cx, Hint } from '@/components/ui'
import { TagsManager } from '@/features/tags'
import { query } from '@/lib/api'
import { c } from '@/lib/copy'
import { useThemeMode } from '@/lib/theme'

const SIDEBAR_KEY = 'sitehub-sidebar'
const mobileQuery = '(max-width: 860px)'

const themes = [
  ['light', Sun, c.light],
  ['dark', Moon, c.dark],
  ['system', Monitor, c.system],
]

function useMobile() {
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

function readCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === 'collapsed'
  } catch {
    return false
  }
}

/** Sidebar content shared by the desktop rail and the mobile drawer. */
function SidebarBody({ collapsed, count, onTags, onNavigate }) {
  const { mode, setMode } = useThemeMode()
  const current = themes.find(([value]) => value === mode) ?? themes[2]
  const CurrentIcon = current[1]
  const item = (to, Icon, label, extra) => (
    <Hint label={label} side="right" disabled={!collapsed}>
      <NavLink
        to={to}
        end={to === '/'}
        className="nav-item"
        onClick={onNavigate}
        aria-label={collapsed ? label : undefined}
      >
        <Icon size={16} aria-hidden />
        <span className="nav-label">{label}</span>
        {extra}
      </NavLink>
    </Hint>
  )
  return (
    <>
      <div className="side-brand">
        <img className="brand-mark" src="/logo.png" alt="" width={28} height={28} />
        <span className="nav-label brand-name">{c.app}</span>
      </div>
      <nav aria-label={c.navigation} className="side-nav">
        <p className="side-group nav-label">{c.overview}</p>
        {item(
          '/',
          Globe,
          c.websites,
          count !== undefined && (
            <Badge>
              <span data-testid="website-count">{count > 9999 ? '9999+' : count}</span>
            </Badge>
          ),
        )}
        {item('/accounts', KeyRound, c.accounts)}
        <p className="side-group nav-label">{c.manage}</p>
        <Hint label={c.tags} side="right" disabled={!collapsed}>
          <button
            type="button"
            className="nav-item"
            aria-label={collapsed ? c.tags : undefined}
            onClick={() => {
              onNavigate?.()
              onTags()
            }}
          >
            <Tags size={16} aria-hidden />
            <span className="nav-label">{c.tags}</span>
          </button>
        </Hint>
      </nav>
      <div className="side-foot">
        {collapsed ? (
          <Button
            variant="ghost"
            icon
            aria-label={`${c.theme}: ${current[2]}`}
            onClick={() => setMode(themes[(themes.indexOf(current) + 1) % themes.length][0])}
          >
            <CurrentIcon size={16} />
          </Button>
        ) : (
          <ToggleGroup
            className="segmented"
            aria-label={c.theme}
            value={[mode]}
            onValueChange={(value) => value[0] && setMode(value[0])}
          >
            {themes.map(([value, Icon, label]) => (
              <Hint key={value} label={label} side={collapsed ? 'right' : 'top'}>
                <Toggle value={value} aria-label={label} className="segment">
                  <Icon size={14} />
                </Toggle>
              </Hint>
            ))}
          </ToggleGroup>
        )}
      </div>
    </>
  )
}

function pageTitle(pathname) {
  if (pathname === '/') return c.websites
  if (pathname.startsWith('/accounts')) return c.accounts
  return c.notFound
}

export function Shell() {
  const mobile = useMobile()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [drawer, setDrawer] = useState(false)
  const [tags, setTags] = useState(false)
  const { pathname } = useLocation()
  const count = useQuery({ queryKey: ['count'], queryFn: () => query('/api/websites/count') })

  const toggle = () => {
    if (mobile) {
      setDrawer((open) => !open)
      return
    }
    setCollapsed((value) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, value ? 'expanded' : 'collapsed')
      } catch {}
      return !value
    })
  }
  // Ctrl/Cmd + B toggles the sidebar, like most editors.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggle()
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })

  const expanded = mobile ? drawer : !collapsed
  const label = expanded ? c.collapseSidebar : c.expandSidebar
  const Icon = expanded ? PanelLeftClose : PanelLeftOpen
  const body = (onNavigate) => (
    <SidebarBody
      collapsed={!mobile && collapsed}
      count={count.data?.count}
      onTags={() => setTags(true)}
      onNavigate={onNavigate}
    />
  )
  return (
    <div className={cx('app', !mobile && collapsed && 'is-collapsed')}>
      {!mobile && (
        <aside id="sidebar" className="sidebar" aria-label={c.sidebar}>
          {body()}
        </aside>
      )}
      <div className="main">
        <header className="topbar">
          <Button
            variant="ghost"
            size="sm"
            icon
            aria-label={label}
            aria-expanded={expanded}
            aria-controls="sidebar"
            onClick={toggle}
          >
            <Icon size={16} />
          </Button>
          <span className="topbar-sep" aria-hidden />
          <span className="topbar-title">{pageTitle(pathname)}</span>
          <kbd className="kbd hide-sm" title={c.sidebarShortcut}>
            Ctrl B
          </kbd>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
      {mobile && (
        <Dialog.Root open={drawer} onOpenChange={setDrawer}>
          <Dialog.Portal>
            <Dialog.Backdrop className="backdrop" />
            <Dialog.Viewport className="viewport side-viewport">
              <Dialog.Popup id="sidebar" className="sidebar sidebar-drawer" aria-label={c.sidebar}>
                <Dialog.Title className="sr-only">{c.sidebar}</Dialog.Title>
                {body(() => setDrawer(false))}
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      )}
      {tags && <TagsManager onClose={() => setTags(false)} />}
    </div>
  )
}

export function PageHead({ title, intro, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  )
}
