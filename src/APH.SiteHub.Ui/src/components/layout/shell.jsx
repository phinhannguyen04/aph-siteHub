import { useQuery } from '@tanstack/react-query'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Button } from '@/components/ui'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { TagsManager } from '@/features/tags'
import { useMobile } from '@/hooks/use-mobile'
import { query } from '@/lib/api'
import { c } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { SidebarBody } from './sidebar-body'
import { readCollapsed, SIDEBAR_KEY } from './sidebar-state'

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
    <div className={cn('app', !mobile && collapsed && 'is-collapsed')}>
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
        <Dialog open={drawer} onOpenChange={setDrawer}>
          <DialogContent
            variant="bare"
            id="sidebar"
            className="sidebar sidebar-drawer"
            aria-label={c.sidebar}
          >
            <DialogTitle className="sr-only">{c.sidebar}</DialogTitle>
            {body(() => setDrawer(false))}
          </DialogContent>
        </Dialog>
      )}
      {tags && <TagsManager onClose={() => setTags(false)} />}
    </div>
  )
}
