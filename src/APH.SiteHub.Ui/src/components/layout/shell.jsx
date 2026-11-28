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
import { SidebarBody, sidebarClass } from './sidebar-body'
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
    <div
      className={cn(
        'grid min-h-dvh grid-cols-[var(--sidebar-width)_minmax(0,1fr)] transition-[grid-template-columns] duration-200 ease-linear max-[860px]:grid-cols-[minmax(0,1fr)]',
        !mobile && collapsed && 'grid-cols-[var(--sidebar-rail)_minmax(0,1fr)]',
      )}
    >
      {!mobile && (
        <aside id="sidebar" className={sidebarClass} aria-label={c.sidebar}>
          {body()}
        </aside>
      )}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex h-(--topbar-height) items-center gap-2 border-b border-border bg-[color-mix(in_oklab,var(--surface-muted)_92%,transparent)] px-4 backdrop-blur-sm">
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
          <span className="h-4 w-px bg-input" aria-hidden />
          <span className="font-semibold text-ink">{pageTitle(pathname)}</span>
          <kbd
            className="ml-auto rounded-md border border-border px-1.5 py-0.5 font-sans text-xs font-normal text-subtle max-[860px]:hidden"
            title={c.sidebarShortcut}
          >
            Ctrl B
          </kbd>
        </header>
        <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-4 px-6 pt-6 pb-12 max-[560px]:px-3">
          <Outlet />
        </main>
      </div>
      {mobile && (
        <Dialog open={drawer} onOpenChange={setDrawer}>
          <DialogContent
            variant="bare"
            id="sidebar"
            className={cn(
              sidebarClass,
              'fixed inset-y-0 left-0 w-[min(280px,86vw)] shadow-[var(--shadow-popup)] data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
            )}
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
