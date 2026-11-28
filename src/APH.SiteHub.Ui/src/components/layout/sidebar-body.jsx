import { Globe, KeyRound, Monitor, Moon, Sun, Tags } from 'lucide-react'
import { NavLink } from 'react-router'
import { Badge, Button, Hint } from '@/components/ui'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { c } from '@/lib/copy'
import { useThemeMode } from '@/lib/theme'
import { cn } from '@/lib/utils'

const themes = [
  ['light', Sun, c.light],
  ['dark', Moon, c.dark],
  ['system', Monitor, c.system],
]

/** Sidebar content shared by the desktop rail and the mobile drawer. */
export const sidebarClass =
  'sticky top-0 flex h-dvh flex-col gap-2 overflow-x-hidden overflow-y-auto border-r border-border bg-secondary p-2'

export function SidebarBody({ collapsed, count, onTags, onNavigate }) {
  const { mode, setMode } = useThemeMode()
  const current = themes.find(([value]) => value === mode) ?? themes[2]
  const CurrentIcon = current[1]
  const navItem = cn(
    'flex min-h-8 w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent p-1.5 text-left font-normal whitespace-nowrap text-foreground no-underline transition-colors duration-200 hover:bg-muted active:bg-border [&_svg]:shrink-0',
    'aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground [&[aria-current=page]_[data-slot=badge]]:bg-white/20 [&[aria-current=page]_[data-slot=badge]]:text-inherit',
    collapsed && 'justify-center px-0',
  )
  const navLabel = (extra) =>
    cn(
      'flex-1 overflow-hidden text-ellipsis transition-opacity duration-200',
      collapsed && 'absolute size-px opacity-0',
      extra,
    )
  const group = cn(
    'mx-1.5 mt-3 mb-0.5 text-xs font-semibold tracking-[0.06em] whitespace-nowrap text-subtle uppercase',
    collapsed && 'm-2 mx-1.5 h-px bg-border text-[0px]',
  )
  const item = (to, Icon, label, extra) => (
    <Hint label={label} side="right" disabled={!collapsed}>
      <NavLink
        to={to}
        end={to === '/'}
        className={navItem}
        onClick={onNavigate}
        aria-label={collapsed ? label : undefined}
      >
        <Icon size={16} aria-hidden />
        <span className={navLabel()}>{label}</span>
        {extra}
      </NavLink>
    </Hint>
  )
  return (
    <>
      <div
        className={cn(
          'flex h-[calc(var(--topbar-height)-8px)] items-center gap-2 px-1.5 text-base font-semibold whitespace-nowrap text-ink',
          collapsed && 'justify-center px-0',
        )}
      >
        <img
          className="block size-7 shrink-0 object-contain"
          src="/logo.png"
          alt=""
          width={28}
          height={28}
        />
        <span className={navLabel()}>{c.app}</span>
      </div>
      <nav aria-label={c.navigation} className="flex flex-col gap-0.5">
        <p className={group}>{c.overview}</p>
        {item(
          '/',
          Globe,
          c.websites,
          count !== undefined && (
            <Badge className={collapsed ? 'hidden' : undefined}>
              <span data-testid="website-count">{count > 9999 ? '9999+' : count}</span>
            </Badge>
          ),
        )}
        {item('/accounts', KeyRound, c.accounts)}
        <p className={group}>{c.manage}</p>
        <Hint label={c.tags} side="right" disabled={!collapsed}>
          <button
            type="button"
            className={navItem}
            aria-label={collapsed ? c.tags : undefined}
            onClick={() => {
              onNavigate?.()
              onTags()
            }}
          >
            <Tags size={16} aria-hidden />
            <span className={navLabel()}>{c.tags}</span>
          </button>
        </Hint>
      </nav>
      <div className="mt-auto flex">
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
            type="single"
            className="flex flex-1 gap-0.5 rounded-md border border-border bg-background p-0.5"
            aria-label={c.theme}
            value={mode}
            onValueChange={(value) => value && setMode(value)}
          >
            {themes.map(([value, Icon, label]) => (
              <Hint key={value} label={label} side={collapsed ? 'right' : 'top'}>
                <ToggleGroupItem
                  value={value}
                  aria-label={label}
                  className="grid h-6 flex-1 cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-subtle hover:bg-muted data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <Icon size={14} />
                </ToggleGroupItem>
              </Hint>
            ))}
          </ToggleGroup>
        )}
      </div>
    </>
  )
}
