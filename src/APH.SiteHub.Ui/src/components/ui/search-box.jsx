import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function SearchBox({ label, value, onChange }) {
  return (
    <div className="relative min-w-[200px] flex-1">
      <Search
        size={14}
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-[var(--text-tertiary)]"
      />
      <Input
        type="search"
        className="pl-6"
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
