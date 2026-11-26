import { Globe, KeyRound, Monitor, Moon, Sun, Tags } from 'lucide-react'
import { NavLink } from 'react-router'
import { Badge, Button, Hint } from '@/components/ui'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { c } from '@/lib/copy'
import { useThemeMode } from '@/lib/theme'

const themes = [
  ['light', Sun, c.light],
  ['dark', Moon, c.dark],
  ['system', Monitor, c.system],
]

/** Sidebar content shared by the desktop rail and the mobile drawer. */
export function SidebarBody({ collapsed, count, onTags, onNavigate }) {
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
            type="single"
            className="segmented"
            aria-label={c.theme}
            value={mode}
            onValueChange={(value) => value && setMode(value)}
          >
            {themes.map(([value, Icon, label]) => (
              <Hint key={value} label={label} side={collapsed ? 'right' : 'top'}>
                <ToggleGroupItem value={value} aria-label={label} className="segment">
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
