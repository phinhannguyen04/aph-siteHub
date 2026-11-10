'use client'
import { useQuery } from '@tanstack/react-query'
import { Globe, KeyRound, LayoutGrid, LogOut, Menu, Monitor, Moon, Sun, Tags } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode, useState } from 'react'
import { ChangePassword } from '@/components/auth/change-password'
import { useSession } from '@/components/layout/providers'
import { TagsManager } from '@/components/tags/manager'
import { query } from '@/lib/api/client'
import { c } from '@/lib/copy'
import { cx } from '@/lib/cx'
import { type ThemeMode, useThemeMode } from '@/lib/theme'

const themeIcons = { light: Sun, dark: Moon, system: Monitor }

export function Shell({ children }: { children: ReactNode }) {
  const [mobile, setMobile] = useState(false)
  const [tags, setTags] = useState(false)
  const [password, setPassword] = useState(false)
  const path = usePathname()
  const session = useSession()
  const { mode, setMode } = useThemeMode()
  const ThemeIcon = themeIcons[mode]
  const count = useQuery({
    queryKey: ['count'],
    queryFn: () => query<{ count: number }>('/api/websites/count'),
  })
  const links = [
    { href: '/', label: c.websites, icon: Globe },
    { href: '/accounts', label: c.accounts, icon: LayoutGrid },
  ]
  return (
    <div className="drawer md:drawer-open">
      <input
        id="sitehub-nav"
        type="checkbox"
        className="drawer-toggle"
        tabIndex={-1}
        aria-hidden
        checked={mobile}
        onChange={(e) => setMobile(e.target.checked)}
      />
      <div className="drawer-content flex min-h-dvh min-w-0 flex-col">
        <header className="navbar sticky top-0 z-20 gap-2 border-b border-base-300 bg-base-100/90 backdrop-blur md:hidden">
          <button
            type="button"
            className="btn btn-ghost btn-square"
            aria-label={c.menu}
            onClick={() => setMobile(true)}
          >
            <Menu size={20} />
          </button>
          <span className="text-lg font-semibold">
            {path === '/accounts' ? c.accounts : c.websites}
          </span>
        </header>
        <main className="mx-auto w-full max-w-[1900px] min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
          {children}
        </main>
      </div>
      <div className="drawer-side z-40">
        <label htmlFor="sitehub-nav" aria-label={c.closeMenu} className="drawer-overlay" />
        <aside className="flex min-h-full w-64 flex-col border-e border-base-300 bg-base-100">
          <div className="flex items-center gap-3 px-5 py-5">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-content">
              <Globe size={18} aria-hidden />
            </span>
            <span className="text-lg font-bold tracking-tight">{c.app}</span>
          </div>
          <nav aria-label={c.navigation} className="flex flex-1 flex-col">
            <ul className="menu w-full gap-1 px-3">
              <li className="menu-title">{c.overview}</li>
              {links.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cx(path === item.href && 'menu-active')}
                    aria-current={path === item.href ? 'page' : undefined}
                    onClick={() => setMobile(false)}
                  >
                    <item.icon size={18} aria-hidden />
                    <span className="flex-1">{item.label}</span>
                    {item.href === '/' && count.data && (
                      <span
                        data-testid="website-count"
                        className={cx(
                          'badge badge-sm',
                          path === item.href ? 'badge-ghost' : 'badge-primary',
                        )}
                      >
                        {count.data.count > 9999 ? '9999+' : count.data.count}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="menu w-full gap-1 px-3 pt-2">
              <li className="menu-title">{c.manage}</li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setMobile(false)
                    setTags(true)
                  }}
                >
                  <Tags size={18} aria-hidden />
                  {c.tags}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setMobile(false)
                    setPassword(true)
                  }}
                >
                  <KeyRound size={18} aria-hidden />
                  {c.changePassword}
                </button>
              </li>
            </ul>
            <div className="mt-auto flex flex-col gap-3 border-t border-base-300 p-4">
              <label className="select select-sm w-full">
                <ThemeIcon size={16} className="opacity-60" aria-hidden />
                <select
                  aria-label={c.theme}
                  value={mode}
                  onChange={(e) => setMode(e.target.value as ThemeMode)}
                >
                  <option value="light">{c.light}</option>
                  <option value="dark">{c.dark}</option>
                  <option value="system">{c.system}</option>
                </select>
              </label>
              <button
                type="button"
                className="btn btn-ghost btn-sm justify-start"
                onClick={() => void session.logout()}
              >
                <LogOut size={16} aria-hidden />
                {c.signOut}
              </button>
            </div>
          </nav>
        </aside>
      </div>
      {tags && <TagsManager onClose={() => setTags(false)} />}
      {password && <ChangePassword onClose={() => setPassword(false)} />}
    </div>
  )
}
