'use client'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { useQuery } from '@tanstack/react-query'
import {
  Globe,
  KeyRound,
  LayoutGrid,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Sun,
  Tags,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode, useState } from 'react'
import { ChangePassword } from '@/components/auth/change-password'
import { Badge, Button, SelectBox } from '@/components/common'
import { useSession } from '@/components/layout/providers'
import { TagsManager } from '@/components/tags/manager'
import { query } from '@/lib/api/client'
import { c } from '@/lib/copy'
import { cx } from '@/lib/cx'
import { type ThemeMode, useThemeMode } from '@/lib/theme'

const themeIcons = { light: Sun, dark: Moon, system: Monitor }
const navItem =
  'flex w-full items-center gap-3 rounded-field px-3 py-2 text-start text-sm transition-colors hover:bg-base-content/10'

function MenuTitle({ children }: { children: ReactNode }) {
  return <li className="px-3 pt-2 pb-1 text-xs font-semibold text-base-content/60">{children}</li>
}

function Sidebar({
  path,
  count,
  mode,
  setMode,
  onNavigate,
  onTags,
  onPassword,
  onClose,
}: {
  path: string
  count?: number
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  /** Called after any item is chosen (closes the mobile drawer). */
  onNavigate: () => void
  onTags: () => void
  onPassword: () => void
  onClose?: () => void
}) {
  const session = useSession()
  const ThemeIcon = themeIcons[mode]
  const links = [
    { href: '/', label: c.websites, icon: Globe },
    { href: '/accounts', label: c.accounts, icon: LayoutGrid },
  ]
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-content">
          <Globe size={18} aria-hidden />
        </span>
        <span className="flex-1 text-lg font-bold tracking-tight">{c.app}</span>
        {onClose && (
          <Button variant="ghost" size="sm" square aria-label={c.closeMenu} onClick={onClose}>
            <X size={18} />
          </Button>
        )}
      </div>
      <nav aria-label={c.navigation} className="flex flex-1 flex-col">
        <ul className="flex w-full flex-col gap-1 px-3">
          <MenuTitle>{c.overview}</MenuTitle>
          {links.map((item) => {
            const active = path === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cx(
                    navItem,
                    active && 'bg-neutral text-neutral-content hover:bg-neutral',
                  )}
                  aria-current={active ? 'page' : undefined}
                  onClick={onNavigate}
                >
                  <item.icon size={18} aria-hidden />
                  <span className="flex-1">{item.label}</span>
                  {item.href === '/' && count !== undefined && (
                    <Badge
                      size="sm"
                      tone={active ? 'ghost' : 'primary'}
                      data-testid="website-count"
                    >
                      {count > 9999 ? '9999+' : count}
                    </Badge>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
        <ul className="flex w-full flex-col gap-1 px-3 pt-2">
          <MenuTitle>{c.manage}</MenuTitle>
          <li>
            <button
              type="button"
              className={navItem}
              onClick={() => {
                onNavigate()
                onTags()
              }}
            >
              <Tags size={18} aria-hidden />
              {c.tags}
            </button>
          </li>
          <li>
            <button
              type="button"
              className={navItem}
              onClick={() => {
                onNavigate()
                onPassword()
              }}
            >
              <KeyRound size={18} aria-hidden />
              {c.changePassword}
            </button>
          </li>
        </ul>
        <div className="mt-auto flex flex-col gap-3 border-t border-base-300 p-4">
          <SelectBox
            size="sm"
            aria-label={c.theme}
            icon={<ThemeIcon size={16} aria-hidden />}
            value={mode}
            onChange={(e) => setMode(e.target.value as ThemeMode)}
          >
            <option value="light">{c.light}</option>
            <option value="dark">{c.dark}</option>
            <option value="system">{c.system}</option>
          </SelectBox>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => void session.logout()}
          >
            <LogOut size={16} aria-hidden />
            {c.signOut}
          </Button>
        </div>
      </nav>
    </div>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const [mobile, setMobile] = useState(false)
  const [tags, setTags] = useState(false)
  const [password, setPassword] = useState(false)
  const path = usePathname()
  const { mode, setMode } = useThemeMode()
  const count = useQuery({
    queryKey: ['count'],
    queryFn: () => query<{ count: number }>('/api/websites/count'),
  })
  const sidebar = {
    path,
    count: count.data?.count,
    mode,
    setMode,
    onTags: () => setTags(true),
    onPassword: () => setPassword(true),
  }
  return (
    <div className="md:flex">
      <aside className="hidden w-64 shrink-0 border-e border-base-300 bg-base-100 md:sticky md:top-0 md:block md:h-dvh md:overflow-y-auto">
        <Sidebar {...sidebar} onNavigate={() => {}} />
      </aside>
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-base-300 bg-base-100/90 px-2 backdrop-blur md:hidden">
          <Button variant="ghost" square aria-label={c.menu} onClick={() => setMobile(true)}>
            <Menu size={20} />
          </Button>
          <span className="text-lg font-semibold">
            {path === '/accounts' ? c.accounts : c.websites}
          </span>
        </header>
        <main className="mx-auto w-full max-w-[1900px] min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
          {children}
        </main>
      </div>
      {mobile && (
        <Dialog open onClose={() => setMobile(false)} className="relative z-40 md:hidden">
          <DialogBackdrop className="fixed inset-0 animate-fade-in bg-black/40" />
          <div className="fixed inset-0 flex">
            <DialogPanel
              aria-label={c.menu}
              className="h-full w-64 max-w-[85vw] animate-slide-in-start overflow-y-auto border-e border-base-300 bg-base-100"
            >
              <Sidebar
                {...sidebar}
                onNavigate={() => setMobile(false)}
                onClose={() => setMobile(false)}
              />
            </DialogPanel>
          </div>
        </Dialog>
      )}
      {tags && <TagsManager onClose={() => setTags(false)} />}
      {password && <ChangePassword onClose={() => setPassword(false)} />}
    </div>
  )
}
