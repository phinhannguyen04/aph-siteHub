import { RefreshCw } from 'lucide-react'
import { Button, SearchBox, Select } from '@/components/ui'
import { c } from '@/lib/copy'

export function AccountToolbar({ f, count, refreshing, onRefresh }) {
  return (
    <div className="toolbar">
      <SearchBox label={c.searchAccounts} value={f.search} onChange={f.setSearch} />
      <Select
        label={c.provider}
        value={f.provider || 'all'}
        onValueChange={(v) => f.setProvider(v === 'all' ? '' : v)}
        options={[
          { value: 'all', label: `${c.provider}: ${c.all}` },
          ...f.providers.map((p) => ({ value: p, label: p })),
        ]}
      />
      <Select
        label={c.status}
        value={f.status}
        onValueChange={f.setStatus}
        options={[
          { value: 'all', label: `${c.status}: ${c.all}` },
          { value: 'limited', label: c.limited },
          { value: 'unlimited', label: c.unlimited },
        ]}
      />
      <span className="help">{c.count(count)}</span>
      <Button size="sm" icon aria-label={c.refresh} onClick={onRefresh}>
        <RefreshCw size={15} className={refreshing ? 'spinning' : undefined} />
      </Button>
    </div>
  )
}
