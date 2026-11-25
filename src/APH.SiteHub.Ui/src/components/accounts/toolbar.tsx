import { LayoutGrid, Plus, RefreshCw, Rows3, Search } from 'lucide-react'
import { Button, Field, SelectField } from '@/components/common'
import { c } from '@/lib/copy'
import { cx } from '@/lib/cx'

type Props = {
  search: string
  setSearch: (v: string) => void
  provider: string
  setProvider: (v: string) => void
  status: string
  setStatus: (v: string) => void
  view: string
  setView: (v: string) => void
  providers: string[]
  count: number
  refreshing: boolean
  refresh: () => void
  onAdd: () => void
}
export function AccountToolbar({
  search,
  setSearch,
  provider,
  setProvider,
  status,
  setStatus,
  view,
  setView,
  providers,
  count,
  refreshing,
  refresh,
  onAdd,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-4 lg:flex-row lg:items-end">
        <Field
          type="search"
          label={c.searchAccounts}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="lg:flex-[1.5]"
          start={<Search size={16} className="opacity-50" aria-hidden />}
        />
        <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-1">
          <SelectField
            label={c.provider}
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="lg:flex-1"
          >
            <option value="">{c.all}</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </SelectField>
          <SelectField
            label={c.status}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="lg:flex-1"
          >
            <option value="all">{c.all}</option>
            <option value="limited">{c.limited}</option>
            <option value="unlimited">{c.unlimited}</option>
          </SelectField>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="flex-1 lg:flex-none"
            onClick={refresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={cx(refreshing && 'animate-spin')} aria-hidden />
            {c.refresh}
          </Button>
          <Button variant="primary" className="flex-1 lg:flex-none" onClick={onAdd}>
            <Plus size={16} aria-hidden />
            {c.addAccount}
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-base-content/70">{c.count(count)}</p>
        {/* biome-ignore lint/a11y/useSemanticElements: toolbar-style toggle group */}
        <div
          className="hidden md:inline-flex [&>*:not(:first-child)]:-ms-px [&>*:not(:first-child)]:rounded-s-none [&>*:not(:last-child)]:rounded-e-none"
          role="group"
          aria-label={c.viewMode}
        >
          {(
            [
              ['list', c.list, LayoutGrid],
              ['table', c.table, Rows3],
            ] as const
          ).map(([value, label, Icon]) => (
            <Button
              key={value}
              size="sm"
              variant={view === value ? 'primary' : 'default'}
              aria-label={label}
              aria-pressed={view === value}
              onClick={() => setView(value)}
            >
              <Icon size={16} />
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
